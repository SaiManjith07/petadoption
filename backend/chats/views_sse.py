"""
Server-Sent Events (SSE) views for real-time chat updates
SSE is simpler and more reliable than WebSockets for one-way real-time updates
"""
from django.http import StreamingHttpResponse, JsonResponse
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
import json
import time
from .models import ChatRoom, Message
from .serializers import MessageSerializer

User = get_user_model()


def get_user_from_token(request):
    """Extract and validate user from JWT token (query param or header)"""
    # Try to get token from query parameter (for EventSource)
    token = request.GET.get('token')
    
    # If not in query, try Authorization header
    if not token:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        return AnonymousUser()
    
    try:
        # Validate token
        UntypedToken(token)
        from rest_framework_simplejwt.authentication import JWTAuthentication
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        user = jwt_auth.get_user(validated_token)
        return user
    except (InvalidToken, TokenError, Exception) as e:
        print(f"[SSE] Token validation error: {e}")
        return AnonymousUser()


@require_http_methods(["GET"])
@csrf_exempt  # SSE doesn't support CSRF tokens
def stream_messages(request, room_id):
    """
    Server-Sent Events endpoint for streaming new messages in a chat room.
    Client connects and receives new messages as they arrive.
    Note: EventSource doesn't support custom headers, so token is passed as query param.
    """
    try:
        # Authenticate user from token (query param or header)
        user = get_user_from_token(request)
        if isinstance(user, AnonymousUser):
            return JsonResponse(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get room by room_id (string like "3_6")
        try:
            room = ChatRoom.objects.get(room_id=room_id)
        except ChatRoom.DoesNotExist:
            # Fallback to integer ID
            try:
                room = ChatRoom.objects.get(id=int(room_id))
            except (ValueError, ChatRoom.DoesNotExist):
                return JsonResponse(
                    {'error': 'Room not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Verify user has access
        try:
            if user not in room.participants.all() and not user.is_staff:
                return JsonResponse(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            # If participants field doesn't work, check user_a and user_b
            try:
                if hasattr(room, 'user_a') and hasattr(room, 'user_b'):
                    if user.id not in [room.user_a_id, room.user_b_id] and not user.is_staff:
                        return JsonResponse(
                            {'error': 'Permission denied'},
                            status=status.HTTP_403_FORBIDDEN
                        )
            except Exception:
                return JsonResponse(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get the last message ID the client has seen (optional)
        last_message_id = request.GET.get('last_id', None)
        
        def event_stream():
            """Generator function that yields SSE formatted messages"""
            # Track connection state
            connection_start_time = time.time()
            max_connection_time = 3600  # 1 hour max connection time
            last_activity = time.time()
            timeout_seconds = 120  # 2 minutes of inactivity = disconnect
            
            # Send initial connection message
            try:
                yield f"data: {json.dumps({'type': 'connected', 'room_id': str(room_id)})}\n\n"
            except (BrokenPipeError, ConnectionResetError, OSError):
                # Client disconnected immediately
                return
            
            # Track the last message ID we sent
            last_sent_id = int(last_message_id) if last_message_id and last_message_id.isdigit() else 0
            
            # Keep connection alive with periodic heartbeats
            last_heartbeat = time.time()
            heartbeat_interval = 30  # Send heartbeat every 30 seconds
            
            iteration_count = 0
            max_iterations = 3600  # Safety limit: max 3600 iterations (1 hour at 1s intervals)
            
            while True:
                try:
                    # Check if connection has timed out
                    current_time = time.time()
                    if current_time - connection_start_time > max_connection_time:
                        print(f"[SSE] Connection timeout for room {room_id} after {max_connection_time}s")
                        yield f"data: {json.dumps({'type': 'timeout', 'message': 'Connection timeout'})}\n\n"
                        break
                    
                    # Check for client disconnect (if request is closed)
                    if hasattr(request, '_closed') and request._closed:
                        print(f"[SSE] Client disconnected for room {room_id}")
                        break
                    
                    # Safety limit on iterations
                    iteration_count += 1
                    if iteration_count > max_iterations:
                        print(f"[SSE] Max iterations reached for room {room_id}")
                        yield f"data: {json.dumps({'type': 'timeout', 'message': 'Max iterations reached'})}\n\n"
                        break
                    
                    # Check for new messages
                    # Only select fields that exist to avoid database errors
                    new_messages = Message.objects.filter(
                        room=room,
                        id__gt=last_sent_id
                    ).select_related('sender').order_by('created_at')[:10]
                    
                    message_sent = False
                    for message in new_messages:
                        try:
                            # Pass request context to serializer so image URLs are properly generated
                            serializer = MessageSerializer(message, context={'request': request})
                            yield f"data: {json.dumps({'type': 'message', 'data': serializer.data})}\n\n"
                            last_sent_id = message.id
                            last_activity = time.time()
                            message_sent = True
                        except (BrokenPipeError, ConnectionResetError, OSError):
                            # Client disconnected
                            print(f"[SSE] Client disconnected while sending message for room {room_id}")
                            return
                        except Exception as msg_error:
                            # If serialization fails (e.g., missing column), skip this message
                            print(f"[SSE] Error serializing message {message.id}: {msg_error}")
                            continue
                    
                    # Send heartbeat to keep connection alive
                    if current_time - last_heartbeat >= heartbeat_interval:
                        try:
                            yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': current_time})}\n\n"
                            last_heartbeat = current_time
                            last_activity = current_time
                        except (BrokenPipeError, ConnectionResetError, OSError):
                            # Client disconnected during heartbeat
                            print(f"[SSE] Client disconnected during heartbeat for room {room_id}")
                            return
                    
                    # Check for inactivity timeout (no messages or heartbeats for too long)
                    if current_time - last_activity > timeout_seconds:
                        print(f"[SSE] Inactivity timeout for room {room_id} after {timeout_seconds}s")
                        yield f"data: {json.dumps({'type': 'timeout', 'message': 'Inactivity timeout'})}\n\n"
                        break
                    
                    # Small delay to prevent excessive database queries
                    time.sleep(1)
                    
                except (BrokenPipeError, ConnectionResetError, OSError) as conn_error:
                    # Client disconnected
                    print(f"[SSE] Connection error for room {room_id}: {conn_error}")
                    break
                except GeneratorExit:
                    # Generator was closed (client disconnected)
                    print(f"[SSE] Generator closed for room {room_id}")
                    break
                except Exception as e:
                    # Send error and close connection
                    try:
                        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    except:
                        pass
                    print(f"[SSE] Error in event_stream for room {room_id}: {e}")
                    break
        
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # Disable buffering in nginx
        # Note: 'Connection: keep-alive' is a hop-by-hop header and cannot be set directly
        # Django's development server will handle connection management automatically
        # Allow CORS for SSE
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        return response
        
    except Exception as e:
        return JsonResponse(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

