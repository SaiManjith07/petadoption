from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import AdminLog, SystemSettings
from .serializers import AdminLogSerializer, SystemSettingsSerializer
from pets.models import Pet, AdoptionApplication
from chats.models import ChatRoom, Message
from users.models import User


class AdminLogListView(generics.ListAPIView):
    """List all admin logs."""
    queryset = AdminLog.objects.select_related('admin').all()
    serializer_class = AdminLogSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['action', 'model_type', 'admin']


class SystemSettingsListView(generics.ListCreateAPIView):
    """List and create system settings."""
    queryset = SystemSettings.objects.select_related('updated_by').all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)


class SystemSettingsDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete system settings."""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'key'

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def log_admin_action(request):
    """Create an admin log entry."""
    serializer = AdminLogSerializer(data=request.data)
    if serializer.is_valid():
        log = serializer.save(
            admin=request.user,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response(AdminLogSerializer(log).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """Get dashboard statistics for admin."""
    try:
        from .models import DashboardStats
        import traceback
        
        # Get or create dashboard stats
        stats = None
        try:
            stats = DashboardStats.get_latest()
        except Exception as get_error:
            print(f"Error getting dashboard stats: {get_error}")
            print(traceback.format_exc())
            # Try to calculate stats directly from database if model doesn't exist
            try:
                from pets.models import Pet
                from users.models import User
                from pets.models import AdoptionApplication
                
                print("DashboardStats model not available, calculating stats directly from database")
                total_pets = Pet.objects.count()
                pending_pets = Pet.objects.filter(adoption_status='Pending', is_verified=False).count()
                found_pets = Pet.objects.filter(adoption_status='Found', is_verified=True).count()
                lost_pets = Pet.objects.filter(adoption_status='Lost', is_verified=True).count()
                available_pets = Pet.objects.filter(adoption_status='Available for Adoption').count()
                adopted_pets = Pet.objects.filter(adoption_status='Adopted').count()
                total_users = User.objects.count()
                active_users = User.objects.filter(is_active=True).count()
                total_applications = AdoptionApplication.objects.count()
                pending_applications = AdoptionApplication.objects.filter(status='Pending').count()
                
                # Try to get chat stats
                total_chats = 0
                active_chats = 0
                pending_chat_requests = 0
                try:
                    from chats.models import ChatRoom, ChatRequest
                    total_chats = ChatRoom.objects.count()
                    active_chats = ChatRoom.objects.filter(is_active=True).count()
                    pending_chat_requests = ChatRequest.objects.filter(status='pending').count()
                except Exception:
                    pass  # Chat models might not exist
                
                stats_dict = {
                    'pets': {
                        'total': total_pets,
                        'pending': pending_pets,
                        'found': found_pets,
                        'lost': lost_pets,
                        'available': available_pets,
                        'adopted': adopted_pets,
                    },
                    'users': {
                        'total': total_users,
                        'active': active_users,
                        'regular': total_users - active_users,
                        'rescuers': 0,
                    },
                    'applications': {
                        'total': total_applications,
                        'pending': pending_applications,
                    },
                    'chats': {
                        'total': total_chats,
                        'active': active_chats,
                        'pending_requests': pending_chat_requests,
                    },
                    'pending': {
                        'total': pending_pets,
                        'found': 0,  # Will be calculated by frontend
                        'lost': 0,   # Will be calculated by frontend
                    },
                    'active': {
                        'total': found_pets + lost_pets,
                        'found': found_pets,
                        'lost': lost_pets,
                    },
                    'matched': 0,
                    'recent_activity': {
                        'pets_last_7_days': 0,
                        'users_last_7_days': 0,
                    }
                }
                
                return Response({
                    'data': stats_dict
                })
            except Exception as calc_error:
                print(f"Error calculating stats directly: {calc_error}")
                print(traceback.format_exc())
                # Return default structure
                return Response({
                    'data': {
                        'pets': {'total': 0, 'pending': 0, 'found': 0, 'lost': 0, 'available': 0, 'adopted': 0},
                        'users': {'total': 0, 'active': 0, 'regular': 0, 'rescuers': 0},
                        'pending': {'total': 0, 'found': 0, 'lost': 0},
                        'active': {'total': 0, 'found': 0, 'lost': 0},
                        'matched': 0,
                        'applications': {'total': 0, 'pending': 0},
                        'chats': {'total': 0, 'active': 0, 'pending_requests': 0},
                    }
                })
        
        # Update stats if older than 5 minutes (cache for performance)
        from datetime import timedelta
        if stats:
            try:
                if not stats.last_updated or (timezone.now() - stats.last_updated) > timedelta(minutes=5):
                    stats.updated_by = request.user
                    stats.update_stats()
                    stats.save()  # Save after updating
            except Exception as update_error:
                print(f"Error updating dashboard stats: {update_error}")
                print(traceback.format_exc())
                # Continue with existing stats even if update fails
        
        # Convert to dict with error handling
        if stats:
            try:
                stats_dict = stats.to_dict()
            except Exception as dict_error:
                print(f"Error converting stats to dict: {dict_error}")
                print(traceback.format_exc())
                # Return default structure if to_dict fails
                stats_dict = {
                    'pets': {'total': 0, 'pending': 0, 'found': 0, 'lost': 0, 'available': 0, 'adopted': 0},
                    'users': {'total': 0, 'active': 0, 'regular': 0, 'rescuers': 0},
                    'pending': {'total': 0, 'found': 0, 'lost': 0},
                    'active': {'total': 0, 'found': 0, 'lost': 0},
                    'matched': 0,
                    'applications': {'total': 0, 'pending': 0},
                    'chats': {'total': 0, 'active': 0, 'pending_requests': 0},
                }
        else:
            # Stats object doesn't exist, return default
            stats_dict = {
                'pets': {'total': 0, 'pending': 0, 'found': 0, 'lost': 0, 'available': 0, 'adopted': 0},
                'users': {'total': 0, 'active': 0, 'regular': 0, 'rescuers': 0},
                'pending': {'total': 0, 'found': 0, 'lost': 0},
                'active': {'total': 0, 'found': 0, 'lost': 0},
                'matched': 0,
                'applications': {'total': 0, 'pending': 0},
                'chats': {'total': 0, 'active': 0, 'pending_requests': 0},
            }
        
        return Response({
            'data': stats_dict
        })
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Dashboard stats error: {e}")
        print(error_trace)
        return Response(
            {
                'error': str(e),
                'traceback': error_trace if request.user.is_staff else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_reports(request):
    """Get pending pet reports."""
    report_type = request.query_params.get('report_type', None)
    
    # Get pets that need verification
    # When users report found/lost pets, they are created with adoption_status='Pending' and is_verified=False
    # We need to check both Pending status and unverified Found/Lost pets
    if report_type == 'found':
        # Include: Pending pets with found_date (found pets waiting approval) OR Found pets that aren't verified
        # Found pets are created with adoption_status='Pending' and found_date set
        # CRITICAL: Must have found_date NOT null (this is the key differentiator)
        queryset = Pet.objects.filter(
            is_verified=False,
            found_date__isnull=False  # MUST have found_date
        ).filter(
            Q(adoption_status='Pending') | Q(adoption_status='Found')
        ).exclude(
            # Exclude lost pets
            adoption_status='Lost'
        ).order_by('-created_at')
        
        # Debug logging
        print(f"[DEBUG] Found pets query - report_type={report_type}, count={queryset.count()}")
        for pet in queryset[:5]:  # Log first 5
            print(f"  - Pet ID {pet.id}: name='{pet.name}', found_date={pet.found_date}, status={pet.adoption_status}")
    elif report_type == 'lost':
        # Include: Pending pets without found_date (lost pets waiting approval) OR Lost pets that aren't verified
        # Lost pets are created with adoption_status='Pending' but no found_date
        # CRITICAL: Must have found_date IS null (this is the key differentiator)
        queryset = Pet.objects.filter(
            is_verified=False,
            found_date__isnull=True  # MUST NOT have found_date
        ).filter(
            Q(adoption_status='Pending') | Q(adoption_status='Lost')
        ).exclude(
            # Exclude found pets
            adoption_status='Found'
        ).order_by('-created_at')
        
        # Debug logging
        print(f"[DEBUG] Lost pets query - report_type={report_type}, count={queryset.count()}")
        for pet in queryset[:5]:  # Log first 5
            print(f"  - Pet ID {pet.id}: name='{pet.name}', found_date={pet.found_date}, status={pet.adoption_status}")
    else:
        # Get all unverified pets (Pending, Found, or Lost)
        queryset = Pet.objects.filter(
            Q(adoption_status='Pending', is_verified=False) | 
            Q(adoption_status='Found', is_verified=False) | 
            Q(adoption_status='Lost', is_verified=False)
        ).order_by('-created_at')
    
    from pets.serializers import PetListSerializer
    serializer = PetListSerializer(queryset, many=True, context={'request': request})
    
    return Response({'data': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_requests(request):
    """Get all pending requests (volunteers, shelters, feeding points, etc.)."""
    try:
        from users.models import Volunteer, Shelter, FeedingPoint
        
        # Get pending volunteers (not verified) - check both Volunteer model and User model
        pending_volunteers = Volunteer.objects.filter(
            Q(verified_at__isnull=True) | Q(verified_by__isnull=True)
        ).select_related('user')
        
        # Format volunteer data for frontend
        volunteer_data = []
        for vol in pending_volunteers:
            volunteer_data.append({
                'id': vol.id,
                '_id': vol.id,
                'user': {
                    'id': vol.user.id,
                    'name': vol.user.name,
                    'email': vol.user.email,
                },
                'requested_role': 'volunteer',
                'ngo_name': vol.ngo_name,
                'experience_years': vol.experience_years,
                'can_provide_shelter': vol.can_provide_shelter,
                'shelter_capacity': vol.shelter_capacity,
                'createdAt': vol.created_at.isoformat() if vol.created_at else None,
            })
        
        # Get pending shelters (not verified)
        pending_shelters = Shelter.objects.filter(
            Q(verified_at__isnull=True) | Q(verified_by__isnull=True)
        ).select_related('user')
        
        # Format shelter data for frontend
        shelter_data = []
        for shelter in pending_shelters:
            shelter_data.append({
                'id': shelter.id,
                '_id': shelter.id,
                'shelter_name': shelter.name,  # Use 'name' field from model
                'user': {
                    'id': shelter.user.id,
                    'name': shelter.user.name,
                    'email': shelter.user.email,
                    'phone': shelter.user.phone,
                },
                'location': {
                    'city': shelter.city,
                    'state': shelter.state,
                    'pincode': shelter.pincode,
                    'address': shelter.address,
                },
                'capacity': shelter.total_capacity,
                'total_capacity': shelter.total_capacity,
                'area_sqft': shelter.area_sqft,
                'accepts_feeding_data': shelter.accepts_feeding,
                'facilities': shelter.facilities if isinstance(shelter.facilities, list) else [],
                'contact_info': {
                    'phone': shelter.phone or shelter.user.phone,
                    'email': shelter.email or shelter.user.email,
                },
                'status': 'pending',
                'createdAt': shelter.created_at.isoformat() if hasattr(shelter, 'created_at') and shelter.created_at else None,
            })
        
        # Get active feeding points (admin can review these)
        feeding_points = FeedingPoint.objects.filter(is_active=True).select_related('created_by')
        
        # Format feeding point data for frontend
        feeding_data = []
        for point in feeding_points:
            feeding_data.append({
                'id': point.id,
                '_id': point.id,
                'name': point.name,
                'location_name': point.name,  # Alias for compatibility
                'location': {
                    'address': point.address,
                    'city': point.city,
                    'state': point.state,
                    'pincode': point.pincode,
                },
                'description': point.description,
                'type': 'feeding_point',
                'createdAt': point.created_at.isoformat() if hasattr(point, 'created_at') and point.created_at else None,
            })
        
        # Role requests - if you have a RoleRequest model, add it here
        role_requests = []
        
        # Alerts - if you have an Alert model, add it here
        alerts = []
        
        return Response({
            'data': {
                'role_requests': role_requests,
                'shelter_registrations': shelter_data,
                'feeding_points': feeding_data,
                'alerts': alerts,
            }
        })
    except Exception as e:
        import traceback
        print(f"Error in pending_requests: {e}")
        print(traceback.format_exc())
        return Response({
            'data': {
                'role_requests': [],
                'shelter_registrations': [],
                'feeding_points': [],
                'alerts': [],
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_adoptions(request):
    """Get pending adoption requests."""
    applications = AdoptionApplication.objects.filter(status='Pending').select_related('pet', 'applicant')
    from pets.serializers import AdoptionApplicationSerializer
    serializer = AdoptionApplicationSerializer(applications, many=True, context={'request': request})
    return Response({'data': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_chats(request):
    """Get all chat rooms."""
    try:
        # Check if ChatRoom table exists
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'chats_chatroom'
                );
            """)
            table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            return Response({'data': []})
        
        rooms = ChatRoom.objects.all().prefetch_related('participants', 'messages')
        from chats.serializers import ChatRoomSerializer
        serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
        return Response({'data': serializer.data})
    except Exception as e:
        # Return empty array on error instead of crashing
        import traceback
        print(f"Error in all_chats: {e}")
        print(traceback.format_exc())
        return Response({'data': []})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def chat_stats(request):
    """Get chat statistics."""
    try:
        # Check if ChatRoom table exists
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'chats_chatroom'
                );
            """)
            table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            return Response({
                'data': {
                    'pending_requests': 0,
                    'active_chats': 0,
                    'total_requests': 0,
                    'approved_requests': 0,
                    'rejected_requests': 0,
                }
            })
        
        from chats.models import ChatRequest
        
        # Get chat request stats
        total_requests = ChatRequest.objects.count()
        pending_requests = ChatRequest.objects.filter(status='pending').count()
        approved_requests = ChatRequest.objects.filter(status__in=['admin_approved', 'active']).count()
        rejected_requests = ChatRequest.objects.filter(status='rejected').count()
        
        # Get chat room stats
        active_chats = ChatRoom.objects.filter(is_active=True).count() if table_exists else 0
        
        return Response({
            'data': {
                'pending_requests': pending_requests,
                'active_chats': active_chats,
                'total_requests': total_requests,
                'approved_requests': approved_requests,
                'rejected_requests': rejected_requests,
            }
        })
    except Exception as e:
        # Return default stats on error
        import traceback
        print(f"Error in chat_stats: {e}")
        print(traceback.format_exc())
        return Response({
            'data': {
                'pending_requests': 0,
                'active_chats': 0,
                'total_requests': 0,
                'approved_requests': 0,
                'rejected_requests': 0,
            }
        })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def chat_requests(request):
    """Get all chat requests."""
    try:
        from chats.models import ChatRequest
        from chats.serializers import ChatRequestSerializer
        
        # Get all chat requests, ordered by most recent first
        requests = ChatRequest.objects.select_related(
            'requester', 'target', 'pet'
        ).prefetch_related('pet__category').order_by('-created_at')
        
        serializer = ChatRequestSerializer(requests, many=True)
        return Response({'data': serializer.data})
    except Exception as e:
        import traceback
        print(f"Error fetching chat requests: {traceback.format_exc()}")
        return Response(
            {'error': str(e), 'data': []},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_chat_request(request):
    """Admin endpoint to create a chat request from admin to a user."""
    try:
        from chats.models import ChatRequest
        from chats.serializers import ChatRequestSerializer
        
        target_user_id = request.data.get('target_user_id') or request.data.get('user_id')
        message = request.data.get('message', 'Admin wants to connect with you.')
        request_type = request.data.get('type', 'admin_contact')
        
        if not target_user_id:
            return Response(
                {'error': 'target_user_id or user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Target user not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if target_user == request.user:
            return Response(
                {'error': 'Cannot create chat request with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if request already exists
        existing_request = ChatRequest.objects.filter(
            requester=request.user,
            target=target_user,
            status__in=['pending', 'admin_approved', 'active']
        ).first()
        
        if existing_request:
            serializer = ChatRequestSerializer(existing_request)
            return Response({
                'message': 'Chat request already exists',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        # Create chat request (admin-created requests are auto-approved)
        chat_request = ChatRequest.objects.create(
            requester=request.user,
            target=target_user,
            message=message,
            type=request_type,
            status='admin_approved',  # Admin requests are auto-approved
            admin_approved_at=timezone.now()
        )
        
        serializer = ChatRequestSerializer(chat_request)
        return Response({
            'message': 'Chat request created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in admin_create_chat_request: {e}")
        print(error_trace)
        return Response(
            {'error': f'Failed to create chat request: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def respond_to_chat_request(request, request_id):
    """Respond to a chat request (approve/reject)."""
    try:
        from chats.models import ChatRequest
        from chats.serializers import ChatRequestSerializer
        from chats.views_chat_requests import admin_approve_request, admin_reject_request
        from django.utils import timezone
        
        approved = request.data.get('approved', False)
        admin_notes = request.data.get('admin_notes', '')
        
        # Get the chat request
        try:
            chat_request = ChatRequest.objects.get(id=request_id, status='pending')
        except ChatRequest.DoesNotExist:
            return Response(
                {'error': 'Chat request not found or already processed'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update request with admin notes
        if admin_notes:
            chat_request.admin_notes = admin_notes
        
        if approved:
            # Approve the request
            chat_request.status = 'admin_approved'
            chat_request.admin_approved_at = timezone.now()
            chat_request.save()
            
            # Send WebSocket notifications
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
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
                                'name': getattr(chat_request.requester, 'name', chat_request.requester.email),
                            },
                            'message': chat_request.message,
                            'status': 'admin_approved',
                            'message_text': 'You have a new chat request to review',
                        }
                    }
                )
        else:
            # Reject the request
            chat_request.status = 'rejected'
            chat_request.save()
            
            # Send WebSocket notification to requester
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
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
        
        # Log action
        AdminLog.objects.create(
            admin=request.user,
            action='APPROVE' if approved else 'REJECT',
            model_type='ChatRequest',
            object_id=request_id,
            description=f'{"Approved" if approved else "Rejected"} chat request. Notes: {admin_notes}',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        serializer = ChatRequestSerializer(chat_request)
        return Response({
            'data': serializer.data,
            'message': f'Chat request {"approved" if approved else "rejected"} successfully'
        })
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error responding to chat request: {e}")
        print(error_trace)
        return Response(
            {
                'error': str(e),
                'traceback': error_trace if request.user.is_staff else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    except Exception as e:
        import traceback
        print(f"Error responding to chat request: {traceback.format_exc()}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def accept_adoption_request(request, pet_id):
    """Accept an adoption request."""
    try:
        application = AdoptionApplication.objects.get(pet_id=pet_id, status='Pending')
    except AdoptionApplication.DoesNotExist:
        return Response(
            {'message': 'Adoption application not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    notes = request.data.get('notes', '')
    adopter_id = request.data.get('verification_params', {}).get('adopter_id')
    
    # Update application status
    application.status = 'Approved'
    application.reviewed_by = request.user
    application.reviewed_at = timezone.now()
    application.save()
    
    # Update pet status
    pet = application.pet
    pet.adoption_status = 'Adopted'
    pet.owner = application.applicant
    pet.save()
    
    # Log action
    AdminLog.objects.create(
        admin=request.user,
        action='APPROVE',
        model_type='AdoptionApplication',
        object_id=application.id,
        description=f'Approved adoption request for pet: {pet.name}. Notes: {notes}',
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    # Create notification
    from notifications.models import Notification
    Notification.objects.create(
        user=application.applicant,
        title='Adoption Approved',
        message=f'Your adoption application for "{pet.name}" has been approved!',
        notification_type='adoption_approved',
        link_target=f'/pets/{pet.id}',
        related_pet=pet
    )
    
    from pets.serializers import AdoptionApplicationSerializer
    return Response({
        'data': AdoptionApplicationSerializer(application, context={'request': request}).data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def close_chat_room(request, room_id):
    """Close a chat room."""
    try:
        room = ChatRoom.objects.get(id=room_id)
    except ChatRoom.DoesNotExist:
        return Response(
            {'message': 'Chat room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    room.is_active = False
    room.save()
    
    # Log action
    AdminLog.objects.create(
        admin=request.user,
        action='UPDATE',
        model_type='ChatRoom',
        object_id=room.id,
        description=f'Closed chat room #{room.id}',
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    from chats.serializers import ChatRoomSerializer
    return Response({
        'data': ChatRoomSerializer(room, context={'request': request}).data
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_users(request):
    """Get all users with optional filters."""
    queryset = User.objects.all()
    
    # Apply filters
    role = request.query_params.get('role')
    if role:
        queryset = queryset.filter(role=role)
    
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) | Q(email__icontains=search)
        )
    
    from users.serializers import UserSerializer
    serializer = UserSerializer(queryset, many=True, context={'request': request})
    return Response({'data': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_pets(request):
    """Get all pets with optional filters."""
    queryset = Pet.objects.all()
    
    # Apply filters
    status = request.query_params.get('status')
    if status:
        queryset = queryset.filter(adoption_status=status)
    
    from pets.serializers import PetListSerializer
    serializer = PetListSerializer(queryset, many=True, context={'request': request})
    return Response({'data': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_lost(request):
    """Get all lost pets."""
    queryset = Pet.objects.filter(adoption_status='Lost')
    from pets.serializers import PetListSerializer
    serializer = PetListSerializer(queryset, many=True, context={'request': request})
    return Response({'data': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_found(request):
    """Get all found pets."""
    queryset = Pet.objects.filter(adoption_status='Found')
    from pets.serializers import PetListSerializer
    serializer = PetListSerializer(queryset, many=True, context={'request': request})
    return Response({'data': serializer.data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_pet(request, pet_id):
    """Approve/verify a pet."""
    try:
        pet = Pet.objects.get(id=pet_id)
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    pet.is_verified = True
    original_status = pet.adoption_status
    if pet.adoption_status == 'Pending':
        # Auto-set status based on type parameter or pet name/description
        report_type = request.data.get('type', '').lower()
        # Check if name starts with "Found" or "Lost"
        if 'found' in report_type or (pet.name and 'found' in pet.name.lower()):
            pet.adoption_status = 'Found'
        elif 'lost' in report_type or (pet.name and 'lost' in pet.name.lower()):
            pet.adoption_status = 'Lost'
        else:
            # Default to 'Available for Adoption' if no type specified
            pet.adoption_status = 'Available for Adoption'
    
    # Log action
    AdminLog.objects.create(
        admin=request.user,
        action='APPROVE',
        model_type='Pet',
        object_id=pet.id,
        description=f'Approved pet: {pet.name}',
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    # Create notification to user when admin approves
    # Only send notification to the user who posted the pet (not the admin)
    if pet.posted_by and pet.posted_by != request.user:
        from notifications.models import Notification
        # Check if any approval notification already exists to avoid duplicates
        # (either from signal or previous approval)
        existing_notification = Notification.objects.filter(
            user=pet.posted_by,
            related_pet=pet,
            notification_type__in=['pet_approved', 'pet_verified'],
            is_read=False
        ).first()
        
        if not existing_notification:
            status_message = 'lost' if pet.adoption_status == 'Lost' else 'found' if pet.adoption_status == 'Found' else 'available for adoption'
            Notification.objects.create(
                user=pet.posted_by,  # Only send to the user who posted, not the admin
                title='Pet Report Approved!',
                message=f'Your {status_message} pet report for "{pet.name}" has been approved and is now live!',
                notification_type='pet_approved',
                link_target=f'/pets/{pet.id}',
                related_pet=pet
            )
    
    # Save pet with update_fields to prevent signal from creating duplicate notification
    pet.save(update_fields=['is_verified', 'adoption_status'])
    
    from pets.serializers import PetSerializer
    return Response({'data': PetSerializer(pet, context={'request': request}).data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_pet(request, pet_id):
    """Reject a pet report."""
    try:
        pet = Pet.objects.get(id=pet_id)
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    reason = request.data.get('reason', 'No reason provided')
    
    # Log action
    AdminLog.objects.create(
        admin=request.user,
        action='REJECT',
        model_type='Pet',
        object_id=pet.id,
        description=f'Rejected pet: {pet.name}. Reason: {reason}',
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    # Create notification
    if pet.posted_by:
        from notifications.models import Notification
        Notification.objects.create(
            user=pet.posted_by,
            title='Pet Report Rejected',
            message=f'Your pet report for "{pet.name}" was rejected. Reason: {reason}',
            notification_type='admin_announcement',
            link_target=f'/pets/{pet.id}',
            related_pet=pet
        )
    
    # Optionally delete or deactivate the pet
    # pet.delete()  # Uncomment if you want to delete rejected pets
    
    return Response({'message': 'Pet report rejected', 'data': {'id': pet_id}})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_logs(request):
    """Get all admin logs."""
    logs = AdminLog.objects.select_related('admin').all()
    serializer = AdminLogSerializer(logs, many=True, context={'request': request})
    return Response({'data': serializer.data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_chat_room(request):
    """Admin endpoint to create a chat room between users."""
    try:
        # Get participant IDs from request
        participant_ids = request.data.get('participant_ids', [])
        user_id = request.data.get('user_id')  # Alternative: single user_id
        target_user_id = request.data.get('target_user_id')  # Alternative: target_user_id
        participants = request.data.get('participants', [])  # Alternative: participants array
        
        # Build list of user IDs
        user_ids = []
        if participant_ids:
            user_ids = participant_ids if isinstance(participant_ids, list) else [participant_ids]
        elif user_id:
            # If single user_id provided, create room between admin and that user
            user_ids = [request.user.id, user_id]
        elif target_user_id:
            # If target_user_id provided, create room between admin and target
            user_ids = [request.user.id, target_user_id]
        elif participants:
            user_ids = participants if isinstance(participants, list) else [participants]
        else:
            return Response(
                {'error': 'Please provide participant_ids, user_id, target_user_id, or participants'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure we have at least 2 users (admin + target user)
        if len(user_ids) < 2:
            # If only one user provided, add admin
            if len(user_ids) == 1:
                if user_ids[0] != request.user.id:
                    user_ids.insert(0, request.user.id)
                else:
                    return Response(
                        {'error': 'Cannot create room with yourself only'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        # Remove duplicates and ensure admin is included
        user_ids = list(set(user_ids))
        if request.user.id not in user_ids:
            user_ids.insert(0, request.user.id)
        
        # Ensure we have exactly 2 users for a chat room
        if len(user_ids) > 2:
            user_ids = user_ids[:2]  # Take first 2 users
        
        # Get user objects
        try:
            users = User.objects.filter(id__in=user_ids)
            if users.count() != len(user_ids):
                missing_ids = set(user_ids) - set(users.values_list('id', flat=True))
                return Response(
                    {'error': f'Users not found: {list(missing_ids)}'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': f'Error fetching users: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if room already exists
        existing_room = ChatRoom.objects.filter(
            participants__id=user_ids[0]
        ).filter(
            participants__id=user_ids[1]
        ).distinct().first()
        
        if existing_room:
            # Return existing room
            from chats.serializers import ChatRoomSerializer
            serializer = ChatRoomSerializer(existing_room, context={'request': request})
            return Response({
                'message': 'Room already exists',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        # Create new room
        room = ChatRoom.objects.create()
        
        # Add participants
        for user in users:
            room.participants.add(user)
        
        # Set user_a and user_b if needed (for backward compatibility)
        if len(users) >= 2:
            user_list = list(users)
            room.user_a = user_list[0]
            room.user_b = user_list[1]
            room.save()
        
        # Generate room_id (will be done in save() method, but ensure it's set)
        if not room.room_id:
            sorted_ids = sorted(user_ids)
            room.room_id = f"{sorted_ids[0]}_{sorted_ids[1]}"
            room.save()
        
        # Serialize and return
        from chats.serializers import ChatRoomSerializer
        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response({
            'message': 'Chat room created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in admin_create_chat_room: {e}")
        print(error_trace)
        return Response(
            {'error': f'Failed to create chat room: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
