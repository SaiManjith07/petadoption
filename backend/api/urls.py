"""
Main API URL configuration.
All endpoints are prefixed with /api/
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import models
from django.db import connection
from users import views_role_request, views_feeding

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint for Render and monitoring."""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            'status': 'healthy',
            'service': 'petadoption-backend',
            'database': 'connected'
        }, status=200)
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'service': 'petadoption-backend',
            'database': 'disconnected',
            'error': str(e)
        }, status=503)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_registrations_my(request):
    """Get current user's shelter registration."""
    try:
        from users.models import Shelter
        from users.serializers import ShelterSerializer
        from rest_framework import status
        
        shelter = Shelter.objects.filter(user=request.user).first()
        if shelter:
            serializer = ShelterSerializer(shelter, context={'request': request})
            return Response({'data': serializer.data})
        return Response({'data': None})
    except Exception as e:
        import traceback
        from django.conf import settings
        error_trace = traceback.format_exc()
        print(f"Error in shelter_registrations_my: {str(e)}")
        if getattr(settings, 'DEBUG', False):
            print(error_trace)
        return Response(
            {
                'error': str(e),
                'traceback': error_trace if getattr(settings, 'DEBUG', False) else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_registrations_all(request):
    """Get all shelter registrations (admin only)."""
    try:
        from users.models import Shelter
        from users.serializers import ShelterSerializer
        from rest_framework import status
        
        # Check if user is admin
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'error': 'Only admins can view all shelters'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        shelters = Shelter.objects.all().select_related('user', 'verified_by')
        serializer = ShelterSerializer(shelters, many=True, context={'request': request})
        return Response({'data': serializer.data})
    except Exception as e:
        import traceback
        from django.conf import settings
        error_trace = traceback.format_exc()
        print(f"Error in shelter_registrations_all: {str(e)}")
        if getattr(settings, 'DEBUG', False):
            print(error_trace)
        return Response(
            {
                'error': str(e),
                'traceback': error_trace if getattr(settings, 'DEBUG', False) else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow public access to view shelters
def shelters_list(request):
    """List all verified shelters with optional filtering."""
    try:
        from users.models import Shelter
        from users.serializers import ShelterSerializer
        
        queryset = Shelter.objects.filter(is_verified=True)
        
        # Filter by minimum available capacity
        min_available = request.query_params.get('min_available')
        if min_available:
            try:
                min_available_int = int(min_available)
                # Calculate available capacity
                queryset = queryset.annotate(
                    available_capacity=models.F('total_capacity') - models.F('current_occupancy')
                ).filter(
                    available_capacity__gte=min_available_int,
                    total_capacity__gt=0
                )
            except ValueError:
                pass
        
        serializer = ShelterSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        import traceback
        return Response(
            {'error': str(e), 'traceback': traceback.format_exc()},
            status=500
        )

urlpatterns = [
    # Health check endpoint (must be first for Render health checks)
    path('', health_check, name='health-check'),
    
    # Authentication endpoints
    path('auth/', include('users.urls')),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('users/', include('users.urls')),
    
    # Pet endpoints
    path('pets/', include('pets.urls')),
    
    # Lost pets
    path('lost/', include('pets.urls')),  # Will be handled by pets.urls
    
    # Found pets
    path('found/', include('pets.urls')),  # Will be handled by pets.urls
    
    # Chat endpoints
    path('chats/', include('chats.urls')),
    
    # Notifications endpoints
    path('notifications/', include('notifications.urls')),
    
    # Admin endpoints
    path('admin/', include('adminpanel.urls')),
    
    # Shelter registration endpoints
    path('shelter-registrations/my/', shelter_registrations_my, name='shelter-registrations-my'),
    path('shelter-registrations/all/', shelter_registrations_all, name='shelter-registrations-all'),
    path('shelter-registrations/', include('users.urls')),  # Include shelter registration endpoints (includes POST via users.urls)
    
    # Shelter endpoints - use a prefix to avoid conflicts
    path('shelters/', shelters_list, name='shelters-list'),  # List all verified shelters with filtering
    
    # Feeding points endpoints - direct mapping to avoid double path
    path('feeding-points/', views_feeding.list_feeding_points, name='api-list-feeding-points'),
    path('feeding-points/create/', views_feeding.create_feeding_point, name='api-create-feeding-point'),
    path('feeding-points/<int:point_id>/', views_feeding.feeding_point_detail, name='api-feeding-point-detail'),
    path('feeding-points/<int:point_id>/update/', views_feeding.update_feeding_point, name='api-update-feeding-point'),
    path('feeding-points/<int:point_id>/delete/', views_feeding.delete_feeding_point, name='api-delete-feeding-point'),
    path('feeding-points/<int:point_id>/records/', views_feeding.feeding_records_by_point, name='api-feeding-records-by-point'),
    
    # Health & Vaccination endpoints
    path('health/', include('health.urls')),
    
    # Role requests endpoints - direct paths
    path('role-requests/', views_role_request.RoleRequestListCreateView.as_view(), name='api-role-request-list-create'),
    path('role-requests/my/', views_role_request.my_role_requests, name='api-my-role-requests'),
    path('role-requests/pending/', views_role_request.pending_role_requests, name='api-pending-role-requests'),
    path('role-requests/all/', views_role_request.all_role_requests, name='api-all-role-requests'),
    path('role-requests/statistics/', views_role_request.role_request_statistics, name='api-role-request-statistics'),
    path('role-requests/bulk-approve/', views_role_request.bulk_approve_role_requests, name='api-bulk-approve-role-requests'),
    path('role-requests/bulk-reject/', views_role_request.bulk_reject_role_requests, name='api-bulk-reject-role-requests'),
    path('role-requests/<int:pk>/', views_role_request.RoleRequestDetailView.as_view(), name='api-role-request-detail'),
    path('role-requests/<int:request_id>/approve/', views_role_request.approve_role_request, name='api-approve-role-request'),
    path('role-requests/<int:request_id>/reject/', views_role_request.reject_role_request, name='api-reject-role-request'),
]

