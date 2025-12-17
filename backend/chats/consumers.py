import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, ChatRequest
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat messaging."""
    
    async def connect(self):
        try:
            self.room_id = self.scope['url_route']['kwargs']['room_id']
            self.room_group_name = f'chat_{self.room_id}'
            
            print(f"WebSocket connection attempt for room: {self.room_id}")
            
            # Get user from token
            user = await self.get_user_from_token()
            if not user or isinstance(user, AnonymousUser):
                print(f"WebSocket connection rejected: Invalid or missing user")
                await self.close(code=4001)  # Unauthorized
                return
            
            self.user = user
            print(f"WebSocket user authenticated: {user.id}")
            
            # Verify user has access to this room
            has_access = await self.verify_room_access(self.room_id, user)
            if not has_access:
                print(f"WebSocket connection rejected: User {user.id} does not have access to room {self.room_id}")
                await self.close(code=4003)  # Forbidden
                return
            
            print(f"User {user.id} has access to room {self.room_id}")
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            print(f"WebSocket connection accepted for room {self.room_id}, user {user.id}")
            
            # Send presence update
            try:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'presence_update',
                        'user_id': user.id,
                        'user_name': getattr(user, 'name', user.email),
                        'status': 'online'
                    }
                )
            except Exception as e:
                print(f"Error sending presence update: {e}")
        except Exception as e:
            print(f"Error in WebSocket connect: {e}")
            import traceback
            traceback.print_exc()
            await self.close(code=4000)  # Internal error
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Send presence update
        if hasattr(self, 'user'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.user.id,
                    'user_name': self.user.name,
                    'status': 'offline'
                }
            )
    
    async def receive(self, text_data):
        """Receive message from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'message':
                await self.handle_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'read':
                await self.handle_read(data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def handle_message(self, data):
        """Handle incoming message."""
        content = data.get('content', '').strip()
        if not content:
            return
        
        # Save message to database
        message = await self.save_message(self.room_id, self.user.id, content)
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message['id'],
                    'sender': {
                        'id': self.user.id,
                        'name': self.user.name,
                        'email': self.user.email,
                    },
                    'content': content,
                    'timestamp': message['timestamp'],
                    'read_status': False,
                }
            }
        )
    
    async def handle_typing(self, data):
        """Handle typing indicator."""
        is_typing = data.get('typing', False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'user_name': self.user.name,
                'typing': is_typing
            }
        )
    
    async def handle_read(self, data):
        """Handle read receipt."""
        message_id = data.get('message_id')
        if message_id:
            await self.mark_message_read(message_id, self.user.id)
    
    # WebSocket message handlers
    async def chat_message(self, event):
        """Send message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': event['message']
        }))
    
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
            'typing': event['typing']
        }))
    
    async def presence_update(self, event):
        """Send presence update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
            'status': event['status']
        }))
    
    # Database operations
    @database_sync_to_async
    def get_user_from_token(self):
        """Extract user from JWT token in query string."""
        try:
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            # Try to get token from query string
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=', 1)[1]  # Use split with maxsplit to handle = in token
                    # Handle URL-encoded tokens
                    if '%' in token:
                        import urllib.parse
                        token = urllib.parse.unquote(token)
                    break
            
            if not token:
                print("[WebSocket] No token found in query string")
                return AnonymousUser()
            
            # Validate token
            UntypedToken(token)
            from django.contrib.auth import get_user_model
            from rest_framework_simplejwt.tokens import AccessToken
            
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
            print(f"[WebSocket] Token validated for user: {user.id} ({user.email})")
            return user
        except (TokenError, InvalidToken) as e:
            print(f"[WebSocket] Token validation error: {e}")
            return AnonymousUser()
        except User.DoesNotExist as e:
            print(f"[WebSocket] User not found: {e}")
            return AnonymousUser()
        except Exception as e:
            print(f"[WebSocket] Unexpected error in get_user_from_token: {e}")
            import traceback
            traceback.print_exc()
            return AnonymousUser()
    
    @database_sync_to_async
    def verify_room_access(self, room_id, user):
        """Verify user has access to this chat room."""
        try:
            room = ChatRoom.objects.get(room_id=room_id)
            # Check if user is in participants (most reliable)
            if room.participants.filter(id=user.id).exists():
                return True
            # Fallback: check user_a and user_b
            if room.user_a and room.user_a.id == user.id:
                return True
            if room.user_b and room.user_b.id == user.id:
                return True
            return False
        except ChatRoom.DoesNotExist:
            return False
        except Exception as e:
            print(f"Error verifying room access: {e}")
            return False
    
    @database_sync_to_async
    def save_message(self, room_id, user_id, content):
        """Save message to database."""
        try:
            room = ChatRoom.objects.get(room_id=room_id)
            user = User.objects.get(id=user_id)
            
            message = Message.objects.create(
                room=room,
                sender=user,
                content=content
            )
            
            # Update room's updated_at
            from django.utils import timezone
            room.updated_at = timezone.now()
            room.save(update_fields=['updated_at'])
            
            return {
                'id': message.id,
                'timestamp': message.created_at.isoformat(),
            }
        except ChatRoom.DoesNotExist:
            print(f"[WebSocket] Error saving message: Room {room_id} not found")
            return None
        except User.DoesNotExist:
            print(f"[WebSocket] Error saving message: User {user_id} not found")
            return None
        except Exception as e:
            print(f"[WebSocket] Error saving message: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @database_sync_to_async
    def mark_message_read(self, message_id, user_id):
        """Mark message as read."""
        try:
            message = Message.objects.get(id=message_id)
            # Only mark as read if user is not the sender
            if message.sender.id != user_id:
                message.read_status = True
                message.save(update_fields=['read_status'])
        except Message.DoesNotExist:
            pass


class UserNotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for user notifications (chat requests, etc.)."""
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user_group_name = f'user_{self.user_id}'
        
        # Get user from token
        user = await self.get_user_from_token()
        if not user or isinstance(user, AnonymousUser) or user.id != int(self.user_id):
            await self.close()
            return
        
        self.user = user
        
        # Join user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket."""
        pass
    
    # Notification handlers
    async def chat_request(self, event):
        """Send chat request notification."""
        await self.send(text_data=json.dumps({
            'type': 'chat.request',
            'data': event['data']
        }))
    
    async def admin_approved(self, event):
        """Send admin approval notification."""
        await self.send(text_data=json.dumps({
            'type': 'chat.admin_approved',
            'data': event['data']
        }))
    
    async def user_accepted(self, event):
        """Send user acceptance notification."""
        await self.send(text_data=json.dumps({
            'type': 'chat.user_accepted',
            'data': event['data']
        }))
    
    async def chat_rejected(self, event):
        """Send chat rejection notification."""
        await self.send(text_data=json.dumps({
            'type': 'chat.rejected',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_user_from_token(self):
        """Extract user from JWT token."""
        try:
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=')[1]
                    break
            
            if not token:
                return AnonymousUser()
            
            UntypedToken(token)
            from rest_framework_simplejwt.tokens import AccessToken
            
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except (TokenError, InvalidToken, User.DoesNotExist, Exception):
            return AnonymousUser()

