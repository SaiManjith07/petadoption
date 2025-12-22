"""
Chat Request API Views - New Workflow
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
except ImportError:
    # Channels not installed - WebSocket notifications will be skipped
    get_channel_layer = None
    async_to_sync = lambda x: x
from .models import ChatRequest, ChatRoom
from .serializers import ChatRequestSerializer
import json


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat_request(request):
    """Create a chat request - NEW SIMPLIFIED FLOW.
    
    Flow:
    1. User creates request (status: 'pending') - target user doesn't need to exist
    2. Admin starts verification - creates room with requester (status: 'admin_verifying')
    3. Admin completes verification - adds target user to same room (status: 'active')
    """
    import traceback
    try:
        pet_id = request.data.get('pet_id')
        target_id = request.data.get('target_id')
        message = request.data.get('message', '')
        request_type = request.data.get('type', 'general')
        
        print(f"CREATE CHAT REQUEST:")
        print(f"  pet_id: {pet_id}")
        print(f"  target_id: {target_id}")
        print(f"  requester: {request.user.id} ({request.user.email})")
        print(f"  message: {message[:50] if message else ''}...")
        
        # Get target_id from pet if not provided directly
        if not target_id and pet_id:
            try:
                from pets.models import Pet
                pet = Pet.objects.get(id=int(pet_id))
                
                # Get target from pet (posted_by or owner) - don't validate user exists
                if pet.posted_by_id:
                    target_id = pet.posted_by_id
                    print(f"✓ Using pet.posted_by_id: {target_id}")
                elif pet.owner_id:
                    target_id = pet.owner_id
                    print(f"✓ Using pet.owner_id: {target_id}")
                else:
                    # No owner - use placeholder, admin will handle
                    target_id = request.user.id  # Placeholder
                    print(f"⚠ Pet has no owner, using placeholder target_id. Admin will update.")
            except Exception as e:
                print(f"Error getting pet: {e}")
                return Response(
                    {'error': f'Pet with id {pet_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                    )
        
        if not target_id:
            return Response(
                {'error': 'target_id or pet_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        target_id_int = int(target_id)
        
        # Don't allow self-requests
        if target_id_int == request.user.id:
            return Response(
                {'error': 'Cannot request chat with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for existing pending request
        existing = ChatRequest.objects.filter(
            requester=request.user,
            target_id=target_id_int,
            status__in=['pending', 'admin_verifying', 'admin_approved']
        ).first()
        
        if existing:
            return Response(
                {'error': 'You already have a pending request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create chat request - DON'T VALIDATE TARGET USER EXISTS
        # Admin will handle verification and add users to room
        # First, try to verify if target user exists
        target_user_obj = None
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            target_user_obj = User.objects.filter(id=target_id_int).first()
            if target_user_obj:
                print(f"✓ Target user {target_id_int} exists: {target_user_obj.email}")
            else:
                print(f"⚠ Target user {target_id_int} does not exist. Creating request with null target. Admin will set during verification.")
        except Exception as e:
            print(f"⚠ Could not verify user {target_id_int}: {e}")
        
        create_kwargs = {
            'requester': request.user,
            'status': 'pending',
            'message': message,
            'type': request_type
        }
                
        # Only set target if user exists, otherwise leave null
        if target_user_obj:
            create_kwargs['target_id'] = target_id_int
        else:
            # Store target_id in a custom field or admin_notes for reference
            create_kwargs['admin_notes'] = f'Target user ID: {target_id_int} (to be verified by admin)'
        
        if pet_id:
            try:
                create_kwargs['pet_id'] = int(pet_id)
            except:
                pass
        
        chat_request = ChatRequest.objects.create(**create_kwargs)
        
        # If target was null, store the target_id somewhere admin can access it
        if not target_user_obj:
            # Update admin_notes with target_id for admin reference
            chat_request.admin_notes = f'Target user ID: {target_id_int} (to be verified by admin)\n{chat_request.admin_notes or ""}'
            chat_request.save()
        
        # Send notifications
        try:
            if get_channel_layer:
                channel_layer = get_channel_layer()
            else:
                channel_layer = None
            if channel_layer:
                # Notify admin
                async_to_sync(channel_layer.group_send)(
                    'admin_notifications',
                    {
                        'type': 'chat_request',
                        'data': {
                            'id': chat_request.id,
                            'requester': {
                                'id': request.user.id,
                                'name': getattr(request.user, 'name', request.user.email),
                            },
                            'status': 'pending',
                        }
                    }
                )
        except Exception as e:
            print(f"WebSocket error: {e}")
        
        serializer = ChatRequestSerializer(chat_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH', 'POST'])
@permission_classes([IsAdminUser])
def admin_start_verification(request, request_id):
    """Admin starts verification by creating a chat room with the requester."""
    try:
        # Try to get the request - don't filter by status initially to provide better error messages
        try:
            chat_request = ChatRequest.objects.get(id=request_id)
        except ChatRequest.DoesNotExist:
            return Response(
                {'error': f'Chat request with id {request_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if request is in pending status
        if chat_request.status != 'pending':
            return Response(
                {
                    'error': f'Chat request is not in pending status. Current status: {chat_request.status}',
                    'current_status': chat_request.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create verification chat room between admin and requester
        verification_room, created = ChatRoom.objects.get_or_create(
            room_id=f"admin_verification_{chat_request.id}",
            defaults={
                'is_active': True,
            }
        )
        
        # Ensure is_active is True (in case room already existed)
        verification_room.is_active = True
        verification_room.save()
        
        # Clear and add admin and requester to verification room
        verification_room.participants.clear()
        verification_room.participants.add(request.user, chat_request.requester)
        
        # Verify room was created correctly
        participants = list(verification_room.participants.all())
        print(f"✓ Created verification room {verification_room.id} (room_id: {verification_room.room_id})")
        print(f"  is_active: {verification_room.is_active}")
        print(f"  Participants ({len(participants)}): {[p.id for p in participants]}")
        
        # Update chat request status and track verifying admin
        chat_request.status = 'admin_verifying'
        chat_request.admin_verification_room = verification_room
        chat_request.verified_by_admin = request.user  # Track which admin verified
        chat_request.save()
        
        # Send WebSocket notifications
        channel_layer = None
        if get_channel_layer:
            channel_layer = get_channel_layer()
        if channel_layer:
            # Notify requester
            async_to_sync(channel_layer.group_send)(
                f'user_{chat_request.requester.id}',
                {
                    'type': 'verification_started',
                    'data': {
                        'id': chat_request.id,
                        'status': 'admin_verifying',
                        'message': 'Admin has started verification. Please chat with admin.',
                        'room_id': verification_room.room_id or str(verification_room.id),
                    }
                }
            )
        
        serializer = ChatRequestSerializer(chat_request, context={'request': request})
        return Response({
            **serializer.data,
            'verification_room_id': verification_room.room_id or str(verification_room.id),
        }, status=status.HTTP_200_OK)
        
    except ChatRequest.DoesNotExist:
        return Response(
            {'error': 'Chat request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in admin_start_verification: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH', 'POST'])
@permission_classes([IsAdminUser])
def admin_complete_verification(request, request_id):
    """Admin completes verification and adds target user to the existing verification room."""
    try:
        chat_request = ChatRequest.objects.get(id=request_id, status='admin_verifying')
        admin_notes = request.data.get('admin_notes', '')
        target_user_id = request.data.get('target_user_id')  # Admin can provide target user ID
        
        # Get the verification room (already exists with admin and requester)
        verification_room = chat_request.admin_verification_room
        if not verification_room:
            return Response(
                {'error': 'Verification room not found. Please start verification first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get target user - either from chat_request.target or from admin_notes or request data
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        target_user = None
        if chat_request.target:
            target_user = chat_request.target
        elif target_user_id:
            try:
                target_user = User.objects.get(id=int(target_user_id))
                # Update chat_request with target user
                chat_request.target = target_user
            except User.DoesNotExist:
                return Response(
                    {'error': f'Target user with id {target_user_id} does not exist.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Try to extract from admin_notes
            import re
            notes = chat_request.admin_notes or ''
            match = re.search(r'Target user ID: (\d+)', notes)
            if match:
                target_user_id_from_notes = int(match.group(1))
                try:
                    target_user = User.objects.get(id=target_user_id_from_notes)
                    chat_request.target = target_user
                except User.DoesNotExist:
                    return Response(
                        {'error': f'Target user ID {target_user_id_from_notes} from notes does not exist. Please provide valid target_user_id.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'error': 'Target user not found. Please provide target_user_id in request.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # STEP 2: Add target user to the SAME verification room (admin and requester stay in room)
        # The room now becomes the final room with all 3 users: admin, requester, and target
        
        # Ensure admin and requester are still in the room (they should be from step 1)
        verification_room.participants.add(request.user, chat_request.requester)
        
        # Add target user to the SAME room
        verification_room.participants.add(target_user)
        
        # Update room metadata (but keep the same room object)
        user_ids = sorted([chat_request.requester.id, target_user.id])
        
        # Update room_id to standard format for compatibility (but admin stays in participants)
        if not verification_room.room_id or verification_room.room_id.startswith('admin_verification_'):
            verification_room.room_id = f"{user_ids[0]}_{user_ids[1]}"
        
        # Set user_a and user_b for the two main users (requester and target)
        # Note: Admin is still in participants, just not in user_a/user_b fields
        verification_room.user_a_id = user_ids[0]
        verification_room.user_b_id = user_ids[1]
        verification_room.chat_request = chat_request
        verification_room.is_active = True
        verification_room.save()
        
        # Verify: Room should now have exactly 3 participants (admin + requester + target)
        participants = list(verification_room.participants.all())
        participant_ids = [p.id for p in participants]
        print(f"✓ STEP 2: Added target user to same room {verification_room.id}")
        print(f"  Room ID: {verification_room.room_id}")
        print(f"  Participants (3): Admin (ID: {request.user.id}), Requester (ID: {chat_request.requester.id}), Target (ID: {target_user.id})")
        assert len(participants) == 3, f"Expected 3 participants, got {len(participants)}"
        assert request.user.id in participant_ids, "Admin should be in participants"
        assert chat_request.requester.id in participant_ids, "Requester should be in participants"
        assert target_user.id in participant_ids, "Target should be in participants"
        
        # Update chat request
        chat_request.status = 'active'
        chat_request.admin_approved_at = timezone.now()
        chat_request.final_chat_room = verification_room  # Same room, now with all 3 users
        if admin_notes:
            chat_request.admin_notes = admin_notes
        chat_request.save()
        
        # Send WebSocket notifications
        channel_layer = None
        if get_channel_layer:
            channel_layer = get_channel_layer()
        if channel_layer:
            # Notify requester
            async_to_sync(channel_layer.group_send)(
                f'user_{chat_request.requester.id}',
                {
                    'type': 'chat_approved',
                    'data': {
                        'id': chat_request.id,
                        'status': 'active',
                        'message': 'Your chat request has been approved. You can now chat!',
                        'room_id': verification_room.room_id or str(verification_room.id),
                    }
                }
            )
            
            # Notify target user
            async_to_sync(channel_layer.group_send)(
                f'user_{chat_request.target.id}',
                {
                    'type': 'chat_approved',
                    'data': {
                        'id': chat_request.id,
                        'requester': {
                            'id': chat_request.requester.id,
                            'name': getattr(chat_request.requester, 'name', chat_request.requester.email),
                        },
                        'message': chat_request.message,
                        'status': 'active',
                        'message_text': 'A chat has been approved. You can now chat!',
                        'room_id': verification_room.room_id or str(verification_room.id),
                    }
                }
            )
        
        serializer = ChatRequestSerializer(chat_request, context={'request': request})
        return Response({
            **serializer.data,
            'final_room_id': verification_room.room_id or str(verification_room.id),
        }, status=status.HTTP_200_OK)
        
    except ChatRequest.DoesNotExist:
        return Response(
            {'error': 'Chat request not found or not in verification status'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in admin_complete_verification: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_reject_request(request, request_id):
    """Admin rejects a chat request."""
    try:
        chat_request = ChatRequest.objects.get(id=request_id, status='pending')
        admin_notes = request.data.get('admin_notes', '')
        
        chat_request.status = 'rejected'
        if admin_notes:
            chat_request.admin_notes = admin_notes
        chat_request.save()
        
        # Send WebSocket notification to requester
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'user_{chat_request.requester.id}',
                {
                    'type': 'chat_rejected',
                    'data': {
                        'id': chat_request.id,
                        'status': 'rejected',
                        'message': 'Your chat request has been rejected by admin',
                    }
                }
            )
        
        serializer = ChatRequestSerializer(chat_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except ChatRequest.DoesNotExist:
        return Response(
            {'error': 'Chat request not found or not in pending status'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in admin_reject_request: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_view_chat_readonly(request, room_id):
    """Allow any admin to view a chat room in read-only mode.
    
    This endpoint allows admins (who didn't verify the request) to view chats
    for monitoring purposes. The verifying admin stays in the room and can send messages.
    Other admins can only view messages.
    """
    try:
        from .models import ChatRoom, Message
        from .serializers import MessageSerializer, ChatRoomSerializer
        
        # Get the chat room
        try:
            room = ChatRoom.objects.get(room_id=room_id)
        except ChatRoom.DoesNotExist:
            # Try by ID
            try:
                room = ChatRoom.objects.get(id=room_id)
            except ChatRoom.DoesNotExist:
                return Response(
                    {'error': 'Chat room not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Check if this room is associated with a chat request
        chat_request = None
        is_verifying_admin = False
        
        # Check if room is linked to a chat request
        if hasattr(room, 'chat_request'):
            chat_request = room.chat_request
        else:
            # Try to find chat request by verification room or final room
            try:
                chat_request = ChatRequest.objects.filter(
                    Q(admin_verification_room=room) | Q(final_chat_room=room)
                ).first()
            except Exception:
                pass
        
        # Check if current admin is the verifying admin
        if chat_request and chat_request.verified_by_admin:
            is_verifying_admin = (chat_request.verified_by_admin.id == request.user.id)
        
        # Get room details
        room_serializer = ChatRoomSerializer(room, context={'request': request})
        
        # Get messages
        messages = Message.objects.filter(room=room).select_related('sender').order_by('created_at')
        messages_serializer = MessageSerializer(messages, many=True, context={'request': request})
        
        # Get participants
        participants = list(room.participants.all())
        
        return Response({
            'room': room_serializer.data,
            'messages': messages_serializer.data,
            'participants': [
                {
                    'id': p.id,
                    'name': getattr(p, 'name', p.email),
                    'email': p.email,
                    'is_staff': getattr(p, 'is_staff', False),
                    'is_verifying_admin': chat_request and chat_request.verified_by_admin and chat_request.verified_by_admin.id == p.id if chat_request else False,
                }
                for p in participants
            ],
            'is_readonly': not is_verifying_admin,  # True for non-verifying admins
            'is_verifying_admin': is_verifying_admin,
            'chat_request': ChatRequestSerializer(chat_request, context={'request': request}).data if chat_request else None,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error in admin_view_chat_readonly: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
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


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def user_accept_request(request, request_id):
    """Target user accepts or rejects a chat request - REDESIGNED FOR ROBUSTNESS."""
    try:
        # Validate request_id
        try:
            request_id = int(request_id)
        except (ValueError, TypeError):
            return Response(
                {'error': f'Invalid request ID: {request_id}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get chat request
        try:
            chat_request = ChatRequest.objects.select_related('requester', 'target').get(
                id=request_id,
                target=request.user,
                status='admin_approved'
            )
        except ChatRequest.DoesNotExist:
            return Response(
                {'error': 'Chat request not found, already processed, or you are not authorized'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get approved status
        approved = request.data.get('approved', True)
        if isinstance(approved, str):
            approved = approved.lower() in ('true', '1', 'yes')
        
        if approved:
            # ACCEPT - Create room and activate chat (SIMPLIFIED)
            from django.db import transaction
            
            try:
                with transaction.atomic():
                    # Calculate room_id
                    user_ids = sorted([chat_request.requester.id, chat_request.target.id])
                    room_id = f"{user_ids[0]}_{user_ids[1]}"
                    
                    # Get or create room (simplified - uses get_or_create)
                    room, created = ChatRoom.objects.get_or_create(
                        room_id=room_id,
                        defaults={
                            'user_a_id': user_ids[0],
                            'user_b_id': user_ids[1],
                            'chat_request': chat_request,
                            'is_active': True,
                        }
                    )
                    
                    # Update room if it existed
                    if not created:
                        if not room.user_a_id:
                            room.user_a_id = user_ids[0]
                        if not room.user_b_id:
                            room.user_b_id = user_ids[1]
                        if not room.chat_request_id:
                            room.chat_request = chat_request
                        room.is_active = True
                        room.save()
                    
                    # Add participants
                    if chat_request.requester not in room.participants.all():
                        room.participants.add(chat_request.requester)
                    if chat_request.target not in room.participants.all():
                        room.participants.add(chat_request.target)
                    
                    # Update chat request status
                    chat_request.status = 'active'
                    chat_request.user_accepted_at = timezone.now()
                    chat_request.save()
                
                # Return success response
                return Response({
                    'id': chat_request.id,
                    'status': 'active',
                    'room_id': room.room_id or room_id,
                    'message': 'Chat request accepted successfully'
                }, status=status.HTTP_200_OK)
                
            except Exception as room_error:
                import traceback
                print(f"Error creating room: {room_error}")
                print(traceback.format_exc())
                return Response(
                    {'error': f'Failed to create chat room: {str(room_error)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # REJECT
            chat_request.status = 'rejected'
            chat_request.save()
            
            return Response({
                'id': chat_request.id,
                'status': 'rejected',
                'message': 'Chat request rejected'
            }, status=status.HTTP_200_OK)
        
    except ChatRequest.DoesNotExist:
        return Response(
            {'error': 'Chat request not found or already processed'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"✗✗✗ Error in user_accept_request: {error_type}: {error_msg}")
        print(error_trace)
        # Return detailed error for debugging
        return Response(
            {
                'error': error_msg,
                'error_type': error_type,
                'detail': 'Check server logs for more information',
                'traceback': error_trace if hasattr(request, 'user') and request.user.is_staff else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_chat_requests(request, user_id):
    """Get chat requests for a specific user."""
    if int(user_id) != request.user.id and not request.user.is_staff:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    requests = ChatRequest.objects.filter(
        target_id=user_id
    ).order_by('-created_at')
    
    serializer = ChatRequestSerializer(requests, many=True, context={'request': request})
    return Response({'data': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_chat_requests(request):
    """Get all chat requests (admin only)."""
    try:
        # Get all chat requests with proper related field loading
        # Use select_related for ForeignKey relationships
        chat_requests = ChatRequest.objects.select_related(
            'requester', 'target', 'pet'
        ).select_related(
            'admin_verification_room', 'admin_verification_room__user_a', 'admin_verification_room__user_b',
            'final_chat_room', 'final_chat_room__user_a', 'final_chat_room__user_b'
        ).prefetch_related(
            'admin_verification_room__participants',
            'final_chat_room__participants'
        ).order_by('-created_at')
        
        # Serialize with error handling for each request
        serialized_data = []
        for chat_request in chat_requests:
            try:
                serializer = ChatRequestSerializer(chat_request, context={'request': request})
                serialized_data.append(serializer.data)
            except Exception as ser_error:
                import traceback
                print(f"Error serializing chat request {chat_request.id}: {ser_error}")
                print(traceback.format_exc())
                # Add a minimal version of the request data
                serialized_data.append({
                    'id': chat_request.id,
                    'requester': {'id': chat_request.requester.id, 'name': getattr(chat_request.requester, 'name', chat_request.requester.email)} if chat_request.requester else None,
                    'target': {'id': chat_request.target.id, 'name': getattr(chat_request.target, 'name', chat_request.target.email)} if chat_request.target else None,
                    'status': chat_request.status,
                    'type': chat_request.type,
                    'message': chat_request.message,
                    'created_at': chat_request.created_at.isoformat() if chat_request.created_at else None,
                    'error': f'Serialization error: {str(ser_error)}'
                })
        
        return Response({
            'data': serialized_data,
            'count': len(serialized_data)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_type = type(e).__name__
        error_msg = str(e)
        print(f"Error in get_all_chat_requests: {error_type}: {error_msg}")
        print(traceback.format_exc())
        return Response(
            {
                'error': error_msg,
                'error_type': error_type,
                'detail': 'Failed to load all chat requests. Check server logs for details.',
                'data': []
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def mark_pet_reunified(request, room_id):
    """Mark pet as reunited and close the chat room (admin only).
    
    This endpoint:
    1. Marks the pet as 'Reunited' status
    2. Sets is_reunited=True and reunited_at timestamp
    3. Sets reunited_with_owner to the owner/user
    4. Closes the chat room (is_active=False)
    5. Updates chat request status to 'reunited' or 'closed'
    """
    try:
        # Get the chat room
        try:
            chat_room = ChatRoom.objects.get(room_id=room_id)
        except ChatRoom.DoesNotExist:
            try:
                chat_room = ChatRoom.objects.get(id=int(room_id))
            except (ChatRoom.DoesNotExist, ValueError):
                return Response(
                    {'error': 'Chat room not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get the chat request associated with this room
        chat_request = None
        if hasattr(chat_room, 'chat_request') and chat_room.chat_request:
            chat_request = chat_room.chat_request
        else:
            # Try to find chat request by room
            chat_request = ChatRequest.objects.filter(
                admin_verification_room=chat_room
            ).first()
            if not chat_request:
                chat_request = ChatRequest.objects.filter(
                    final_chat_room=chat_room
                ).first()
        
        if not chat_request:
            return Response(
                {'error': 'No chat request found for this room'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the pet
        pet = chat_request.pet
        if not pet:
            return Response(
                {'error': 'No pet associated with this chat request'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the owner (reunited_with_owner)
        # Priority: target user (claimant), then requester, then pet owner
        owner = None
        if chat_request.target:
            owner = chat_request.target
        elif chat_request.requester:
            owner = chat_request.requester
        elif hasattr(pet, 'posted_by') and pet.posted_by:
            owner = pet.posted_by
        elif hasattr(pet, 'owner') and pet.owner:
            owner = pet.owner
        
        # Update pet status
        from pets.models import Pet
        pet.adoption_status = 'Reunited'
        pet.is_reunited = True
        pet.reunited_at = timezone.now()
        if owner:
            pet.reunited_with_owner = owner
        pet.save()
        
        # Close the chat room
        chat_room.is_active = False
        chat_room.save()
        
        # Update chat request status (add 'reunited' status if needed, or use 'closed')
        # For now, we'll add a note in admin_notes
        if not chat_request.admin_notes:
            chat_request.admin_notes = 'Pet marked as reunited by admin'
        else:
            chat_request.admin_notes += '\n\nPet marked as reunited by admin'
        chat_request.save()
        
        return Response({
            'message': 'Pet marked as reunited successfully',
            'pet_id': pet.id,
            'pet_status': pet.adoption_status,
            'chat_room_closed': True,
            'reunited_with': {
                'id': owner.id if owner else None,
                'name': getattr(owner, 'name', owner.email) if owner else None,
                'email': owner.email if owner else None
            } if owner else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error in mark_pet_reunified: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_chat_requests(request):
    """Get current user's chat requests (as requester and target)."""
    try:
        # Use Q objects for better query performance
        from django.db.models import Q
        requests = ChatRequest.objects.filter(
            Q(requester=request.user) | Q(target=request.user)
        ).select_related('requester', 'target').order_by('-created_at')
        
        # Build response manually (no serializer to avoid errors)
        data = []
        for req in requests:
            try:
                data.append({
                    'id': req.id,
                    'status': req.status,
                    'requester_id': req.requester.id if req.requester else None,
                    'target_id': req.target.id if req.target else None,
                    'requester_name': getattr(req.requester, 'name', req.requester.email) if req.requester else '',
                    'target_name': getattr(req.target, 'name', req.target.email) if req.target else '',
                    'message': req.message,
                    'created_at': req.created_at.isoformat() if req.created_at else None,
                    'is_incoming': req.target == request.user,
                })
            except Exception as req_error:
                print(f"Error processing request {req.id}: {req_error}")
                continue
        
        return Response({'data': data}, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"Error in get_my_chat_requests: {error_type}: {error_msg}")
        print(error_trace)
        return Response(
            {
                'error': error_msg,
                'error_type': error_type,
                'detail': 'Failed to load chat requests. Check server logs for details.',
                'data': []
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

