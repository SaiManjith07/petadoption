from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import ChatRoom, Message, ChatRequest
from .serializers import ChatRoomSerializer, ChatRoomListSerializer, MessageSerializer, ChatRequestSerializer


class ChatRoomListView(generics.ListCreateAPIView):
    """List and create chat rooms."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ChatRoomListSerializer
        return ChatRoomSerializer

    def get_queryset(self):
        user = self.request.user
        
        try:
            # Get active status from query params (default to True for active chats)
            include_inactive = self.request.query_params.get('include_inactive', 'false').lower() == 'true'
            
            # Use participants filter (most reliable, always works)
            # This should work regardless of whether user_a/user_b fields exist
            queryset = ChatRoom.objects.filter(
                participants=user
            )
            
            # Filter by active status unless include_inactive is True
            if not include_inactive:
                queryset = queryset.filter(is_active=True)
            
            # Try to prefetch, but don't fail if it doesn't work
            try:
                # Only try to select_related if fields exist - IMPORTANT: Load chat_request and pet for pet_id access
                queryset = queryset.select_related('chat_request', 'chat_request__pet', 'user_a', 'user_b')
            except Exception as e:
                print(f"Warning: Could not use select_related: {e}")
                pass  # Fields might not exist, that's okay
            
            # CRITICAL: Prefetch participants to ensure they're loaded
            try:
                from django.db.models import Prefetch
                queryset = queryset.prefetch_related(
                    Prefetch('participants', queryset=None),  # Load all participants
                    'messages'
                )
            except Exception as e:
                try:
                    # Fallback: simpler prefetch
                    queryset = queryset.prefetch_related('participants', 'messages')
                except Exception as e2:
                    print(f"Warning: Could not prefetch participants: {e2}")
                    try:
                        queryset = queryset.prefetch_related('participants')
                    except Exception:
                        pass  # If prefetch fails, continue without it
            
            return queryset.distinct()
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in get_queryset: {e}")
            print(error_trace)
            # Return empty queryset on error
            return ChatRoom.objects.none()

    def list(self, request, *args, **kwargs):
        """List chat rooms - REDESIGNED FOR ROBUSTNESS."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Build response manually (no complex serialization)
            data = []
            for room in queryset:
                try:
                    # Get other participant
                    other_participant = None
                    # Force evaluation of participants - ensure they're loaded
                    participants = list(room.participants.all())
                    
                    # If no participants found, try to get from user_a and user_b (legacy support)
                    if not participants:
                        if hasattr(room, 'user_a') and room.user_a:
                            participants.append(room.user_a)
                        if hasattr(room, 'user_b') and room.user_b:
                            participants.append(room.user_b)
                    
                    # Build full participants list with all user details
                    participants_list = []
                    for p in participants:
                        participant_data = {
                                'id': p.id,
                                'name': getattr(p, 'name', p.email),
                            'email': p.email,
                            'is_staff': getattr(p, 'is_staff', False),
                            'is_superuser': getattr(p, 'is_superuser', False),
                            'role': getattr(p, 'role', 'user') if hasattr(p, 'role') else ('admin' if (getattr(p, 'is_staff', False) or getattr(p, 'is_superuser', False)) else 'user')
                        }
                        participants_list.append(participant_data)
                        
                        # Set other_participant (not current user)
                        if p.id != request.user.id:
                            other_participant = participant_data
                    
                    # Debug logging
                    print(f"Room {room.id} (room_id: {room.room_id}): Found {len(participants_list)} participants")
                    for p in participants_list:
                        print(f"  - Participant: {p['name']} (ID: {p['id']}, Admin: {p['is_staff'] or p['is_superuser']})")
                    
                    # Get last message
                    last_message = None
                    try:
                        last_msg = room.messages.last()
                        if last_msg:
                            last_message = {
                                'content': last_msg.content[:50] + '...' if len(last_msg.content) > 50 else last_msg.content,
                                'created_at': last_msg.created_at.isoformat() if last_msg.created_at else None,
                                'sender_id': last_msg.sender.id if last_msg.sender else None,
                            }
                    except Exception:
                        pass
                    
                    # Get pet_id and type from chat_request
                    pet_id = None
                    chat_type = None
                    try:
                        # Method 1: Try to get from chat_request (primary method)
                        if hasattr(room, 'chat_request') and room.chat_request:
                            chat_request = room.chat_request
                            # Check if pet exists and is accessible
                            if hasattr(chat_request, 'pet') and chat_request.pet:
                                try:
                                    # Force evaluation of the pet relationship
                                    pet = chat_request.pet
                                    if pet:
                                        pet_id = pet.id
                                        print(f"Room {room.id}: Found pet_id {pet_id} from chat_request.pet")
                                except Exception as pet_error:
                                    print(f"Error accessing pet.id for room {room.id}: {pet_error}")
                                    # Try to get pet_id directly from chat_request if it has a pet_id field
                                    try:
                                        if hasattr(chat_request, 'pet_id') and chat_request.pet_id:
                                            pet_id = chat_request.pet_id
                                            print(f"Room {room.id}: Found pet_id {pet_id} from chat_request.pet_id")
                                    except:
                                        pass
                            
                            if hasattr(chat_request, 'type'):
                                chat_type = chat_request.type
                        
                        # Method 2: If still no pet_id, try to get from ChatRequest directly via reverse lookup
                        if not pet_id:
                            try:
                                from .models import ChatRequest
                                chat_request_obj = ChatRequest.objects.filter(chat_room=room).select_related('pet').first()
                                if chat_request_obj and chat_request_obj.pet:
                                    pet_id = chat_request_obj.pet.id
                                    print(f"Room {room.id}: Found pet_id {pet_id} via reverse lookup")
                            except Exception as reverse_error:
                                print(f"Room {room.id}: Reverse lookup failed: {reverse_error}")
                        
                    except Exception as e:
                        import traceback
                        print(f"Error getting pet_id/type for room {room.id}: {e}")
                        print(traceback.format_exc())
                    
                    # Get admin who created/verified this chat (for permission checking)
                    created_by_admin_id = None
                    created_by_admin = None
                    try:
                        if hasattr(room, 'chat_request') and room.chat_request:
                            chat_request = room.chat_request
                            if hasattr(chat_request, 'verified_by_admin') and chat_request.verified_by_admin:
                                created_by_admin_id = chat_request.verified_by_admin.id
                                created_by_admin = {
                                    'id': chat_request.verified_by_admin.id,
                                    'name': getattr(chat_request.verified_by_admin, 'name', chat_request.verified_by_admin.email),
                                    'email': chat_request.verified_by_admin.email
                                }
                    except Exception as e:
                        print(f"Error getting created_by_admin for room {room.id}: {e}")
                    
                    data.append({
                        'id': room.id,
                        'room_id': room.room_id or getattr(room, 'room_id', None),
                        'other_participant': other_participant,
                        'participants': participants_list,  # Include full participants list
                        'last_message': last_message,
                        'is_active': room.is_active,
                        'created_at': room.created_at.isoformat() if room.created_at else None,
                        'updated_at': room.updated_at.isoformat() if room.updated_at else None,
                        'pet_id': pet_id,
                        'petId': pet_id,  # Also include camelCase for frontend compatibility
                        'type': chat_type,
                        'created_by_admin_id': created_by_admin_id,  # Admin who created/verified this chat
                        'created_by_admin': created_by_admin,  # Full admin info
                    })
                except Exception as room_error:
                    # Skip problematic rooms
                    print(f"Error processing room {room.id}: {room_error}")
                    continue
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(f"Error in ChatRoomListView.list: {e}")
            print(traceback.format_exc())
            return Response(
                {'data': [], 'error': 'Failed to load chat rooms'},
                status=status.HTTP_200_OK
            )

    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        try:
            # Get participant IDs from request data
            participant_ids = self.request.data.get('participant_ids', [])
            user_id = self.request.data.get('user_id')
            target_user_id = self.request.data.get('target_user_id')
            participants = self.request.data.get('participants', [])
            
            # Build list of user IDs
            user_ids = []
            if participant_ids:
                user_ids = participant_ids if isinstance(participant_ids, list) else [participant_ids]
            elif user_id:
                user_ids = [self.request.user.id, user_id]
            elif target_user_id:
                user_ids = [self.request.user.id, target_user_id]
            elif participants:
                user_ids = participants if isinstance(participants, list) else [participants]
            else:
                # Default: just add current user
                user_ids = [self.request.user.id]
            
            # Ensure current user is included
            if self.request.user.id not in user_ids:
                user_ids.insert(0, self.request.user.id)
            
            # Remove duplicates
            user_ids = list(set(user_ids))
            
            # Create room
            room = ChatRoom.objects.create()
            
            # Add participants
            from users.models import User
            users = User.objects.filter(id__in=user_ids)
            for user in users:
                room.participants.add(user)
            
            # Set user_a and user_b if we have 2 users
            if len(users) >= 2:
                user_list = list(users)
                room.user_a = user_list[0]
                room.user_b = user_list[1]
                room.save()
            
            # Ensure room_id is set
            if not room.room_id and len(user_ids) >= 2:
                sorted_ids = sorted(user_ids)
                room.room_id = f"{sorted_ids[0]}_{sorted_ids[1]}"
                room.save()
            
            # Update serializer instance
            serializer.instance = room
        except Exception as e:
            import traceback
            print(f"Error in perform_create: {e}")
            print(traceback.format_exc())
            raise


class ChatRoomDetailView(generics.RetrieveAPIView):
    """Retrieve a specific chat room."""
    serializer_class = ChatRoomListSerializer  # Use ChatRoomListSerializer to include participants with admin info
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user).select_related('chat_request', 'chat_request__pet').prefetch_related('participants', 'messages')
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_room_messages(request, room_id):
    """Get messages for a room by room_id."""
    try:
        # Check for numeric ID first (if passed as string but is number)
        if str(room_id).isdigit():
            try:
                room = ChatRoom.objects.get(id=int(room_id))
            except ChatRoom.DoesNotExist:
                # If not found by ID, try as room_id field
                room = ChatRoom.objects.get(room_id=room_id)
        else:
            try:
                room = ChatRoom.objects.get(room_id=room_id)
            except ChatRoom.MultipleObjectsReturned:
                # Handle duplicate room_ids
                print(f"Warning: Multiple rooms found for room_id {room_id}")
                rooms = ChatRoom.objects.filter(room_id=room_id)
                # Try to find one where user is participant
                room = rooms.filter(participants=request.user).first()
                if not room:
                    room = rooms.first()

        # Verify user has access
        if request.user not in room.participants.all() and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = Message.objects.filter(room=room).select_related('sender').order_by('created_at')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({'data': serializer.data})

    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in get_room_messages: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_or_create_room(request, user_id):
    """Get or create a chat room with another user."""
    try:
        from users.models import User
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'message': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if other_user == request.user:
        return Response(
            {'message': 'Cannot create room with yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Try to find existing room
    room = ChatRoom.objects.filter(
        participants=request.user
    ).filter(
        participants=other_user
    ).distinct().first()

    if not room:
        # Create new room
        room = ChatRoom.objects.create()
        room.participants.add(request.user, other_user)

    serializer = ChatRoomSerializer(room, context={'request': request})
    return Response(serializer.data)


class MessageListView(generics.ListCreateAPIView):
    """List and create messages for a chat room."""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        # Verify user is a participant
        try:
            room = ChatRoom.objects.get(id=room_id, participants=self.request.user)
        except ChatRoom.DoesNotExist:
            return Message.objects.none()
        
        return Message.objects.filter(room=room).select_related('sender')

    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        try:
            room = ChatRoom.objects.get(id=room_id, participants=self.request.user)
        except ChatRoom.DoesNotExist:
            raise PermissionError("You don't have permission to send messages to this room.")
        
        serializer.save(sender=self.request.user, room=room)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, room_id):
    """Send a message to a chat room by room ID (integer)."""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Room not found or access denied'},
            status=status.HTTP_404_NOT_FOUND
        )

    content = request.data.get('content', '').strip()
    if not content:
        return Response(
            {'error': 'Message content is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    message = Message.objects.create(
        room=room,
        sender=request.user,
        content=content
    )

    # Update room's updated_at
    from django.utils import timezone
    room.updated_at = timezone.now()
    room.save(update_fields=['updated_at'])

    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message_by_room_id(request, room_id):
    """Send a message to a chat room by room_id (string like '3_6'). Supports text and images."""
    try:
        # Check for numeric ID first (if passed as string but is number)
        if str(room_id).isdigit():
            try:
                room = ChatRoom.objects.get(id=int(room_id))
            except ChatRoom.DoesNotExist:
                # If not found by ID, try as room_id field
                room = ChatRoom.objects.get(room_id=room_id)
        else:
            try:
                room = ChatRoom.objects.get(room_id=room_id)
            except ChatRoom.MultipleObjectsReturned:
                print(f"Warning: Multiple rooms found for room_id {room_id}")
                rooms = ChatRoom.objects.filter(room_id=room_id)
                # Try to find one where user is participant
                room = rooms.filter(participants=request.user).first()
                if not room:
                    room = rooms.first()

        # Verify user has access
        if request.user not in room.participants.all() and not request.user.is_staff:
            return Response(
                {'error': 'Room not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in send_message_by_room_id: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    content = request.data.get('content', '').strip()
    image = request.FILES.get('image')
    message_type = 'image' if image else 'text'
    
    # Validate: must have either content or image
    if not content and not image:
        return Response(
            {'error': 'Message content or image is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Upload image to Cloudinary if provided
    cloudinary_url = None
    cloudinary_public_id = None
    if image:
        try:
            from pets.cloudinary_utils import upload_image_to_cloudinary
            print(f"[Chat] Uploading image to Cloudinary for chat message in room {room_id}")
            result = upload_image_to_cloudinary(
                image_file=image,
                folder='petadoption/chat_images',
                public_id=None,  # Let Cloudinary generate unique ID
                overwrite=False
            )
            
            if result.get('success'):
                cloudinary_url = result.get('url')
                cloudinary_public_id = result.get('public_id')
                print(f"[Chat] ✓✓✓ Successfully uploaded to Cloudinary: {cloudinary_url}")
            else:
                print(f"[Chat] ✗✗✗ Failed to upload image to Cloudinary: {result.get('error')}")
                # Continue without Cloudinary URL - will use local storage as fallback
        except Exception as e:
            import traceback
            print(f"[Chat] ✗✗✗ Exception uploading image to Cloudinary: {e}")
            print(traceback.format_exc())
            # Continue without Cloudinary URL - will use local storage as fallback

    # Create message - store Cloudinary URL if available, otherwise use local image
    message = Message.objects.create(
        room=room,
        sender=request.user,
        content=content,
        message_type=message_type,
        image=image if image and not cloudinary_url else None,  # Only store locally if Cloudinary upload failed
        cloudinary_url=cloudinary_url,
        cloudinary_public_id=cloudinary_public_id
    )

    # Update room's updated_at
    from django.utils import timezone
    room.updated_at = timezone.now()
    room.save(update_fields=['updated_at'])

    serializer = MessageSerializer(message, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, room_id):
    """Mark all messages in a room as read by room ID (integer)."""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Room not found or access denied'},
            status=status.HTTP_404_NOT_FOUND
        )

    Message.objects.filter(
        room=room
    ).exclude(
        sender=request.user
    ).update(read_status=True)

    return Response({'message': 'Messages marked as read'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_read_by_room_id(request, room_id):
    """Mark all messages in a room as read by room_id (string like '3_6')."""
    try:
        # Check for numeric ID first (if passed as string but is number)
        if str(room_id).isdigit():
            try:
                room = ChatRoom.objects.get(id=int(room_id))
            except ChatRoom.DoesNotExist:
                # If not found by ID, try as room_id field
                room = ChatRoom.objects.get(room_id=room_id)
        else:
            try:
                room = ChatRoom.objects.get(room_id=room_id)
            except ChatRoom.MultipleObjectsReturned:
                # Handle duplicate room_ids
                print(f"Warning: Multiple rooms found for room_id {room_id}")
                rooms = ChatRoom.objects.filter(room_id=room_id)
                # Try to find one where user is participant
                room = rooms.filter(participants=request.user).first()
                if not room:
                    room = rooms.first()

        # Verify user has access
        if request.user not in room.participants.all():
            return Response(
                {'error': 'Room not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in mark_messages_read_by_room_id: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    Message.objects.filter(
        room=room
    ).exclude(
        sender=request.user
    ).update(read_status=True)

    return Response({'message': 'Messages marked as read'}, status=status.HTTP_200_OK)


@api_view(['DELETE', 'POST'])
@permission_classes([IsAuthenticated])
def delete_message_image(request, message_id):
    """Delete an image from a message (WhatsApp style - soft delete)."""
    try:
        message = Message.objects.get(id=message_id, sender=request.user)
        
        # Only allow deletion of image messages
        if message.message_type != 'image':
            return Response(
                {'error': 'This message does not contain an image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Soft delete the image
        message.delete_image()
        
        serializer = MessageSerializer(message, context={'request': request})
        return Response({
            'message': 'Image deleted successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Message.DoesNotExist:
        return Response(
            {'error': 'Message not found or you do not have permission'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error deleting message image: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_chat(request):
    """Request a chat with pet owner/finder (for claim/adoption)."""
    try:
        from pets.models import Pet
        
        pet_id = request.data.get('pet_id')
        requester_id = request.data.get('requester_id')
        request_type = request.data.get('type')  # 'claim' or 'adoption'
        message = request.data.get('message', '')
        
        if not pet_id or not requester_id or not request_type:
            return Response(
                {'error': 'pet_id, requester_id, and type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request_type not in ['claim', 'adoption']:
            return Response(
                {'error': 'type must be either "claim" or "adoption"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify requester is the current user
        if str(request.user.id) != str(requester_id):
            return Response(
                {'error': 'You can only create requests for yourself'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response(
                {'error': 'Pet not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get pet owner (posted_by)
        owner = pet.posted_by if hasattr(pet, 'posted_by') and pet.posted_by else None
        
        # Check if request already exists
        existing_request = ChatRequest.objects.filter(
            pet=pet,
            requester=request.user,
            status__in=['pending', 'pending_owner']
        ).first()
        
        if existing_request:
            return Response(
                {'error': 'You already have a pending request for this pet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create chat request
        chat_request = ChatRequest.objects.create(
            pet=pet,
            requester=request.user,
            owner=owner,
            type=request_type,
            status='pending',  # First needs admin approval
            message=message
        )
        
        serializer = ChatRequestSerializer(chat_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_requests(request):
    """Get chat requests for current user (as requester)."""
    requests = ChatRequest.objects.filter(requester=request.user).order_by('-created_at')
    serializer = ChatRequestSerializer(requests, many=True)
    return Response({'data': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_requests_for_owner(request):
    """Get chat requests for current user (as target) - REDESIGNED FOR ROBUSTNESS."""
    try:
        requests = ChatRequest.objects.filter(
            target=request.user,
            status='admin_approved'
        ).select_related('requester', 'target').order_by('-created_at')
        
        # Build response manually (no serializer to avoid errors)
        data = []
        for req in requests:
            data.append({
                'id': req.id,
                'status': req.status,
                'requester_id': req.requester.id if req.requester else None,
                'requester_name': getattr(req.requester, 'name', req.requester.email) if req.requester else '',
                'message': req.message,
                'created_at': req.created_at.isoformat() if req.created_at else None,
            })
        
        return Response({'data': data}, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error in get_chat_requests_for_owner: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e), 'data': []},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_chat_request(request, request_id):
    """Respond to a chat request (approve/reject by requester or owner)."""
    try:
        chat_request = ChatRequest.objects.get(id=request_id)
        approved = request.data.get('approved', False)
        
        # Check if user has permission (must be requester or owner)
        if chat_request.requester != request.user and chat_request.owner != request.user:
            return Response(
                {'error': 'You do not have permission to respond to this request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if approved:
            if chat_request.status == 'pending_owner' and chat_request.owner == request.user:
                # Owner approves - create chat room
                chat_request.status = 'approved'
                chat_request.owner_approved_at = timezone.now()
                chat_request.save()
                
                # Create chat room
                chat_room = ChatRoom.objects.create()
                chat_room.participants.add(chat_request.requester, chat_request.owner)
                
                return Response({
                    'message': 'Chat request approved and room created',
                    'room_id': chat_room.id,
                    'request': ChatRequestSerializer(chat_request).data
                })
            else:
                return Response(
                    {'error': 'Invalid request status or user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Reject
            chat_request.status = 'rejected'
            if chat_request.owner == request.user:
                chat_request.owner_approved_at = timezone.now()
            chat_request.save()
            
            return Response({
                'message': 'Chat request rejected',
                'request': ChatRequestSerializer(chat_request).data
            })
            
    except ChatRequest.DoesNotExist:
        return Response(
            {'error': 'Chat request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_owner_chat_request(request, request_id):
    """Owner responds to admin-approved chat request."""
    try:
        chat_request = ChatRequest.objects.get(id=request_id)
        approved = request.data.get('approved', False)
        
        # Verify user is the owner
        if chat_request.owner != request.user:
            return Response(
                {'error': 'Only the pet owner can respond to this request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verify status is pending_owner
        if chat_request.status != 'pending_owner':
            return Response(
                {'error': 'This request is not awaiting your approval'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if approved:
            # Owner approves - create chat room
            chat_request.status = 'approved'
            chat_request.owner_approved_at = timezone.now()
            chat_request.save()
            
            # Create chat room
            chat_room = ChatRoom.objects.create()
            chat_room.participants.add(chat_request.requester, chat_request.owner)
            
            return Response({
                'message': 'Chat request approved and room created',
                'room_id': chat_room.id,
                'request': ChatRequestSerializer(chat_request).data
            })
        else:
            # Owner rejects
            chat_request.status = 'rejected'
            chat_request.owner_approved_at = timezone.now()
            chat_request.save()
            
            return Response({
                'message': 'Chat request rejected',
                'request': ChatRequestSerializer(chat_request).data
            })
            
    except ChatRequest.DoesNotExist:
        return Response(
            {'error': 'Chat request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

