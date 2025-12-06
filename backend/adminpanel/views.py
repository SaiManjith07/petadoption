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
        
        # Get or create dashboard stats
        stats = DashboardStats.get_latest()
        
        # Update stats if older than 5 minutes (cache for performance)
        from datetime import timedelta
        if not stats.last_updated or (timezone.now() - stats.last_updated) > timedelta(minutes=5):
            stats.updated_by = request.user
            stats.update_stats()
        
        return Response({
            'data': stats.to_dict()
        })
    except Exception as e:
        import traceback
        return Response(
            {'error': str(e), 'traceback': traceback.format_exc()},
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
        queryset = Pet.objects.filter(
            Q(adoption_status='Pending', is_verified=False, found_date__isnull=False) |
            Q(adoption_status='Found', is_verified=False)
        ).order_by('-created_at')
    elif report_type == 'lost':
        # Include: Pending pets without found_date (lost pets waiting approval) OR Lost pets that aren't verified
        # Lost pets are created with adoption_status='Pending' but no found_date
        queryset = Pet.objects.filter(
            Q(adoption_status='Pending', is_verified=False, found_date__isnull=True) |
            Q(adoption_status='Lost', is_verified=False)
        ).order_by('-created_at')
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
        
        total_requests = ChatRoom.objects.count()
        active_chats = ChatRoom.objects.filter(is_active=True).count()
        pending_requests = 0  # This would need a ChatRequest model if you have one
        approved_requests = ChatRoom.objects.filter(is_active=True).count()
        rejected_requests = ChatRoom.objects.filter(is_active=False).count()
        
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
    # If you have a ChatRequest model, use it here
    # For now, return empty array
    return Response({'data': []})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def respond_to_chat_request(request, request_id):
    """Respond to a chat request (approve/reject)."""
    # Placeholder - implement when ChatRequest model exists
    approved = request.data.get('approved', False)
    admin_notes = request.data.get('admin_notes', '')
    
    # Log action
    AdminLog.objects.create(
        admin=request.user,
        action='APPROVE' if approved else 'REJECT',
        model_type='ChatRoom',
        object_id=request_id,
        description=f'{"Approved" if approved else "Rejected"} chat request. Notes: {admin_notes}',
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    return Response({
        'data': {
            'id': request_id,
            'approved': approved,
            'admin_notes': admin_notes,
            'message': f'Chat request {"approved" if approved else "rejected"} successfully'
        }
    })


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

