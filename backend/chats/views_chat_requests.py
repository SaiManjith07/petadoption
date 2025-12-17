"""
Chat Request API Views - New Workflow
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import ChatRequest, ChatRoom
from .serializers import ChatRequestSerializer
import json


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat_request(request):
    """Create a chat request from User A to User B."""
    import traceback
    try:
        # Support both new format (target_id) and old format (pet_id + requester_id)
        target_id = request.data.get('target_id')
        pet_id = request.data.get('pet_id')  # Optional
        requester_id = request.data.get('requester_id')  # For backward compatibility
        message = request.data.get('message', '')
        request_type = request.data.get('type', 'general')
        
        # Debug logging
        print(f"=" * 80)
        print(f"CREATE CHAT REQUEST - Received data:")
        print(f"  pet_id: {pet_id}")
        print(f"  target_id: {target_id}")
        print(f"  requester_id: {requester_id}")
        print(f"  requester (from request.user): {request.user.id} ({request.user.email})")
        print(f"  type: {request_type}")
        print(f"  message_length: {len(message) if message else 0}")
        print(f"=" * 80)
        
        # If target_id not provided, try to get from pet
        validated_pet_id = None  # Store validated pet_id for later use
        user_validated_via_pet = False  # Flag to track if we validated user via pet_id path
        if not target_id and pet_id:
            try:
                from pets.models import Pet
                try:
                    pet_id_int = int(pet_id)
                    validated_pet_id = pet_id_int  # Store for later
                except (ValueError, TypeError):
                    return Response(
                        {'error': 'Invalid pet_id format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    # Get pet without select_related to avoid issues with invalid foreign keys
                    pet = Pet.objects.get(id=pet_id_int)
                    
                    # Check and fix invalid foreign key references BEFORE accessing them
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    
                    # Check and validate posted_by_id
                    valid_posted_by_id = None
                    if pet.posted_by_id:
                        try:
                            posted_by_user = User.objects.get(id=pet.posted_by_id)
                            valid_posted_by_id = pet.posted_by_id
                            print(f"✓ Pet {pet_id_int} posted_by_id {pet.posted_by_id} is valid (user: {posted_by_user.email})")
                        except User.DoesNotExist:
                            print(f"✗ Pet {pet_id_int} posted_by_id {pet.posted_by_id} is INVALID - clearing it")
                            pet.posted_by_id = None
                            pet.save(update_fields=['posted_by_id'])
                    
                    # Check and validate owner_id
                    valid_owner_id = None
                    if pet.owner_id:
                        try:
                            owner_user = User.objects.get(id=pet.owner_id)
                            valid_owner_id = pet.owner_id
                            print(f"✓ Pet {pet_id_int} owner_id {pet.owner_id} is valid (user: {owner_user.email})")
                        except User.DoesNotExist:
                            print(f"✗ Pet {pet_id_int} owner_id {pet.owner_id} is INVALID - clearing it")
                            pet.owner_id = None
                            pet.save(update_fields=['owner_id'])
                    
                    # Refresh to get updated state
                    pet.refresh_from_db()
                except Pet.DoesNotExist:
                    return Response(
                        {'error': f'Pet with id {pet_id_int} not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Get pet owner (posted_by for found pets, owner for owned pets)
                # For "Found" pets, posted_by is the person who found/reported the pet
                # For "Lost" pets, posted_by is the person who lost the pet
                # owner is the current owner (if adopted)
                # IMPORTANT: Only use validated user IDs, not the pet.posted_by/owner objects
                # which might still have invalid references
                
                # Use validated IDs instead of accessing pet.posted_by/owner directly
                if valid_posted_by_id:
                    target_id = valid_posted_by_id
                    print(f"✓ Using posted_by as target: {target_id} (requester is {request.user.id})")
                elif valid_owner_id:
                    target_id = valid_owner_id
                    print(f"✓ Using owner as target: {target_id} (requester is {request.user.id})")
                else:
                    print(f"✗ Pet {pet_id_int} has no valid posted_by or owner. Pet status: {getattr(pet, 'adoption_status', 'unknown')}")
                    return Response(
                        {
                            'error': 'Cannot create chat request',
                            'detail': 'This pet does not have a valid owner or finder associated with it. The pet\'s owner information may have been invalid and has been cleared. Please contact support to assign a valid owner to this pet before creating a chat request.',
                            'pet_id': pet_id_int
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Double-check target user exists (should always pass at this point, but be safe)
                # Use get_user_model() to ensure we're using the correct User model
                try:
                    # Try to get the user - use all() manager to bypass any custom filters
                    target_user_obj = User.objects.filter(id=target_id).first()
                    if not target_user_obj:
                        # Try with get() to see the exact error
                        try:
                            target_user_obj = User.objects.get(id=target_id)
                        except User.DoesNotExist:
                            raise User.DoesNotExist(f"User with id {target_id} does not exist")
                    
                    print(f"✓✓ Verified target user {target_id} exists: {target_user_obj.email} (is_active={target_user_obj.is_active})")
                    
                    # Mark that we validated the user via pet_id path
                    user_validated_via_pet = True
                    
                    # Check if user is active (optional - you might want to allow inactive users)
                    if not target_user_obj.is_active:
                        print(f"⚠ Warning: Target user {target_id} is inactive")
                except User.DoesNotExist as e:
                    print(f"✗✗ ERROR: Target user {target_id} does not exist in database after validation!")
                    print(f"  Error: {e}")
                    # List all users for debugging
                    all_users = list(User.objects.all().values_list('id', 'email', 'is_active'))
                    print(f"  Available users: {all_users}")
                    print(f"  Looking for user ID: {target_id} (type: {type(target_id)})")
                    return Response(
                        {
                            'error': 'Pet owner not found',
                            'detail': f'The pet (ID: {pet_id_int}) was associated with user ID {target_id}, but that user does not exist in the database. Please contact support to assign a valid owner to this pet before creating a chat request.',
                            'pet_id': pet_id_int,
                            'invalid_user_id': target_id,
                            'debug_info': {
                                'available_user_ids': [u[0] for u in all_users],
                                'target_id_type': str(type(target_id)),
                                'target_id_value': str(target_id)
                            }
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Early check: if requester is the same as target, reject immediately
                if target_id == request.user.id:
                    print(f"EARLY REJECT: User {request.user.id} is the pet owner/finder. Cannot request chat with themselves.")
                    return Response(
                        {
                            'error': 'Cannot request chat with yourself',
                            'detail': f'You are the owner/finder of this pet (ID: {pet_id_int}). You cannot create a chat request with yourself.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                error_msg = str(e)
                error_trace = traceback.format_exc()
                print(f"✗✗✗ ERROR in pet_id path: {error_msg}")
                print(error_trace)
                # Reset validated_pet_id since we had an error
                validated_pet_id = None
                return Response(
                    {
                        'error': 'Error getting pet owner',
                        'detail': error_msg,
                        'traceback': error_trace if request.user.is_staff else None
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Verify requester is the current user (for backward compatibility)
        # Only check if requester_id is provided and not empty
        if requester_id:
            try:
                requester_id_int = int(requester_id)
                if requester_id_int != request.user.id:
                    return Response(
                        {'error': 'You can only create requests for yourself'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except (ValueError, TypeError):
                # If requester_id is invalid, ignore it (will use request.user)
                pass
        
        if not target_id:
            return Response(
                {'error': 'target_id or pet_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_id_int = int(target_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid target_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if target_id_int == request.user.id:
            print(f"ERROR: User {request.user.id} is trying to request chat with themselves (target_id={target_id_int})")
            return Response(
                {
                    'error': 'Cannot request chat with yourself',
                    'detail': 'You cannot create a chat request with yourself. The pet owner/finder is the same as you.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if request already exists
        try:
            existing = ChatRequest.objects.filter(
                requester=request.user,
                target_id=target_id_int,
                status__in=['pending', 'admin_approved']
            ).first()
            
            if existing:
                return Response(
                    {'error': 'You already have a pending request with this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            print(f"Error checking existing requests: {e}")
            print(traceback.format_exc())
        
        # Create chat request
        try:
            # Use validated_pet_id if we already validated it, otherwise try to convert pet_id
            pet_id_to_use = validated_pet_id
            if pet_id_to_use is None and pet_id:
                try:
                    pet_id_to_use = int(pet_id)
                except (ValueError, TypeError):
                    pet_id_to_use = None
            
            # Create chat request with proper error handling
            try:
                # Verify target user exists (only if we didn't already validate it in the pet_id path)
                # If target_id came from pet_id path, we already validated it at line 113
                # Only validate here if target_id was provided directly (not from pet)
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                # Only check if we haven't already validated (i.e., target_id was provided directly, not from pet)
                # IMPORTANT: If validated_pet_id is set OR user_validated_via_pet is True, we already validated the user in the pet_id path above
                print(f"DEBUG: validated_pet_id={validated_pet_id}, user_validated_via_pet={user_validated_via_pet}, target_id_int={target_id_int}, pet_id={pet_id}")
                
                if not validated_pet_id and not user_validated_via_pet:  # If we didn't go through pet_id validation path
                    print(f"DEBUG: Going through direct target_id validation path (validated_pet_id is None)")
                    try:
                        target_user = User.objects.get(id=target_id_int)
                        print(f"✓ Verified target user {target_id_int} exists (direct target_id path): {target_user.email}")
                    except User.DoesNotExist:
                        print(f"✗ Target user {target_id_int} does not exist (direct target_id path)")
                        # List all users for debugging
                        all_users = list(User.objects.all().values_list('id', 'email', 'is_active'))
                        print(f"  Available users: {all_users}")
                        print(f"  Looking for user ID: {target_id_int} (type: {type(target_id_int)})")
                        return Response(
                            {
                                'error': 'Invalid reference',
                                'detail': f'The target user with id {target_id_int} does not exist. Please verify the user exists.',
                                'debug_info': {
                                    'available_user_ids': [u[0] for u in all_users],
                                    'target_id': target_id_int
                                }
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    # We already validated the user in the pet_id path, so we can trust target_id_int
                    print(f"✓ Skipping redundant validation - already validated target user {target_id_int} in pet_id path (validated_pet_id={validated_pet_id}, user_validated_via_pet={user_validated_via_pet})")
                    # Double-check anyway (should always pass, but be safe)
                    try:
                        target_user_check = User.objects.filter(id=target_id_int).first()
                        if not target_user_check:
                            print(f"⚠ WARNING: User {target_id_int} not found even though we validated it earlier!")
                            # This shouldn't happen, but if it does, we need to handle it
                            all_users = list(User.objects.all().values_list('id', 'email', 'is_active'))
                            print(f"  Available users: {all_users}")
                            return Response(
                                {
                                    'error': 'Invalid reference',
                                    'detail': f'The target user with id {target_id_int} does not exist. This is unexpected - please contact support.',
                                    'debug_info': {
                                        'available_user_ids': [u[0] for u in all_users],
                                        'target_id': target_id_int,
                                        'validated_pet_id': validated_pet_id
                                    }
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        print(f"✓✓ Double-check passed: User {target_id_int} exists: {target_user_check.email}")
                    except Exception as check_error:
                        print(f"⚠ Error during double-check: {check_error}")
                        # Continue anyway since we already validated
                
                # Only include pet_id if it's valid
                create_kwargs = {
                    'requester': request.user,
                    'target_id': target_id_int,
                    'status': 'pending',
                    'message': message or '',
                    'type': request_type or 'general'
                }
                
                # Only add pet_id if it's valid (not None)
                if pet_id_to_use is not None:
                    # Verify pet exists before adding it (double-check)
                    try:
                        from pets.models import Pet
                        Pet.objects.get(id=pet_id_to_use)
                        create_kwargs['pet_id'] = pet_id_to_use
                        print(f"Creating chat request with pet_id: {pet_id_to_use}")
                    except Pet.DoesNotExist:
                        # Pet doesn't exist, but we'll still create the request without pet_id
                        print(f"Warning: Pet {pet_id_to_use} does not exist, creating request without pet_id")
                
                print(f"Creating ChatRequest with kwargs: {create_kwargs}")
                chat_request = ChatRequest.objects.create(**create_kwargs)
                # Refresh from DB to get all relationships
                chat_request.refresh_from_db()
            except Exception as db_error:
                error_msg = str(db_error)
                error_trace = traceback.format_exc()
                print(f"=" * 80)
                print(f"Database error creating chat request:")
                print(f"Error message: {error_msg}")
                print(f"Pet ID: {pet_id_to_use}")
                print(f"Target ID: {target_id_int}")
                print(f"Requester ID: {request.user.id}")
                print(f"Full traceback:")
                print(error_trace)
                print(f"=" * 80)
                
                # Check for specific database errors
                if 'unique' in error_msg.lower() or 'duplicate' in error_msg.lower() or 'UNIQUE constraint' in error_msg:
                    return Response(
                        {'error': 'You already have a pending request with this user'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Check for foreign key constraint errors
                if 'foreign key' in error_msg.lower() or 'does not exist' in error_msg.lower() or 'violates foreign key constraint' in error_msg.lower() or 'insert or update' in error_msg.lower():
                    # Try to determine which foreign key is the issue
                    detail_msg = 'The pet or target user does not exist'
                    if 'pet' in error_msg.lower() or 'pets_pet' in error_msg.lower():
                        detail_msg = f'The pet with id {pet_id_to_use} does not exist in the database. Please verify the pet exists.'
                    elif 'target' in error_msg.lower() or 'user' in error_msg.lower() or 'users_user' in error_msg.lower():
                        detail_msg = f'The target user with id {target_id_int} does not exist. Please verify the user exists.'
                    
                    return Response(
                        {
                            'error': 'Invalid reference',
                            'detail': detail_msg,
                            'debug_info': {
                                'pet_id': pet_id_to_use,
                                'target_id': target_id_int,
                                'requester_id': request.user.id,
                                'raw_error': error_msg if request.user.is_staff else None
                            }
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                raise  # Re-raise to be caught by outer exception handler
        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()
            print(f"Error creating chat request: {error_msg}")
            print(error_trace)
            # Check if it's a unique constraint violation
            if 'unique' in error_msg.lower() or 'duplicate' in error_msg.lower():
                return Response(
                    {'error': 'You already have a pending request with this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Return detailed error for debugging (only in development)
            import sys
            if sys.argv and 'runserver' in sys.argv:
                return Response(
                    {
                        'error': 'Failed to create chat request',
                        'detail': error_msg,
                        'traceback': error_trace if request.user.is_staff else None
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            else:
                return Response(
                    {'error': 'Failed to create chat request. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Serialize the response - prefetch related objects first
        try:
            # Prefetch related objects to avoid N+1 queries
            chat_request = ChatRequest.objects.select_related('requester', 'target', 'pet').get(id=chat_request.id)
            serializer = ChatRequestSerializer(chat_request, context={'request': request})
            response_data = serializer.data
        except Exception as e:
            print(f"Error serializing chat request: {e}")
            print(traceback.format_exc())
            # Return minimal response if serialization fails
            response_data = {
                'id': chat_request.id,
                'status': chat_request.status,
                'message': 'Chat request created successfully',
                'requester_id': request.user.id,
                'target_id': target_id_int,
            }
        
        # Send WebSocket notification to target user and admin
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                # Notify target user
                async_to_sync(channel_layer.group_send)(
                    f'user_{target_id_int}',
                    {
                        'type': 'chat_request',
                        'data': {
                            'id': chat_request.id,
                            'requester': {
                                'id': request.user.id,
                                'name': getattr(request.user, 'name', request.user.email),
                                'email': request.user.email,
                            },
                            'message': message or '',
                            'status': 'pending',
                            'created_at': chat_request.created_at.isoformat() if hasattr(chat_request.created_at, 'isoformat') else str(chat_request.created_at),
                        }
                    }
                )
                
                # Notify admin (broadcast to all admin users)
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
                            'target': {
                                'id': target_id_int,
                                'name': getattr(chat_request.target, 'name', 'User') if hasattr(chat_request, 'target') and chat_request.target else 'User',
                            },
                            'status': 'pending',
                            'created_at': chat_request.created_at.isoformat() if hasattr(chat_request.created_at, 'isoformat') else str(chat_request.created_at),
                        }
                    }
                )
        except Exception as ws_error:
            # WebSocket notification failure shouldn't break the request
            print(f"WebSocket notification error: {ws_error}")
            import traceback
            print(traceback.format_exc())
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except ValueError as ve:
        return Response(
            {'error': f'Invalid input: {str(ve)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        error_msg = str(e)
        print(f"Error creating chat request: {error_msg}")
        print(error_trace)
        # Return detailed error for debugging
        return Response(
            {
                'error': error_msg,
                'detail': error_trace if request.user.is_staff else 'An error occurred. Please check server logs.',
                'type': type(e).__name__
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_approve_request(request, request_id):
    """Admin approves a chat request."""
    try:
        chat_request = ChatRequest.objects.get(id=request_id, status='pending')
        admin_notes = request.data.get('admin_notes', '')
        
        chat_request.status = 'admin_approved'
        chat_request.admin_approved_at = timezone.now()
        if admin_notes:
            chat_request.admin_notes = admin_notes
        chat_request.save()
        
        # Send WebSocket notifications
        channel_layer = get_channel_layer()
        if channel_layer:
            # Notify requester
            async_to_sync(channel_layer.group_send)(
                f'user_{chat_request.requester.id}',
                {
                    'type': 'admin_approved',
                    'data': {
                        'id': chat_request.id,
                        'status': 'admin_approved',
                        'message': 'Your chat request has been approved by admin',
                    }
                }
            )
            
            # Notify target user
            async_to_sync(channel_layer.group_send)(
                f'user_{chat_request.target.id}',
                {
                    'type': 'admin_approved',
                    'data': {
                        'id': chat_request.id,
                        'requester': {
                            'id': chat_request.requester.id,
                            'name': chat_request.requester.name,
                        },
                        'message': chat_request.message,
                        'status': 'admin_approved',
                        'message_text': 'You have a new chat request to review',
                    }
                }
            )
        
        serializer = ChatRequestSerializer(chat_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
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

