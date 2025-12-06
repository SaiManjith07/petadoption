from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from .models import FeedingPoint, FeedingRecord, Shelter
from .serializers import FeedingPointSerializer, FeedingRecordSerializer

DEBUG = getattr(settings, 'DEBUG', False)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_feeding_points(request):
    """List all feeding points. Admins see all, others see only active ones."""
    try:
        # Check if user is admin
        is_admin = request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'role', None) == 'admin')
        
        if is_admin:
            # Admins see all feeding points
            feeding_points = FeedingPoint.objects.all().select_related('created_by')
        else:
            # Others see only active feeding points
            feeding_points = FeedingPoint.objects.filter(is_active=True).select_related('created_by')
        
        serializer = FeedingPointSerializer(feeding_points, many=True)
        return Response({'data': serializer.data})
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in list_feeding_points: {str(e)}")
        print(error_trace)
        response_data = {'error': f'Error loading feeding points: {str(e)}'}
        if DEBUG:
            response_data['details'] = error_trace
        return Response(
            response_data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feeding_point_detail(request, point_id):
    """Get feeding point details."""
    try:
        point = FeedingPoint.objects.get(id=point_id, is_active=True)
    except FeedingPoint.DoesNotExist:
        return Response(
            {'message': 'Feeding point not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = FeedingPointSerializer(point)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_feeding_point(request):
    """Authenticated users (admin or verified shelter) can create a feeding point."""
    # Check if user is admin or has verified shelter
    is_admin = request.user.is_staff or request.user.role == 'admin'
    has_verified_shelter = False
    
    if not is_admin:
        try:
            # Check if user has a verified shelter
            shelter = Shelter.objects.filter(user=request.user, is_verified=True).first()
            has_verified_shelter = shelter is not None
        except Exception as e:
            print(f"Error checking shelter: {e}")
            pass
    
    if not is_admin and not has_verified_shelter:
        return Response(
            {'error': 'Only admins and users with verified shelters can create feeding points'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data.copy()
    
    # Handle nested location structure from frontend
    if 'location' in data:
        location = data.pop('location')
        if isinstance(location, dict):
            data['address'] = location.get('address', '')
            data['city'] = location.get('city', '')
            data['state'] = location.get('state', '')
            data['pincode'] = location.get('pincode', '')
            if 'coordinates' in location and location['coordinates']:
                data['latitude'] = location['coordinates'].get('lat')
                data['longitude'] = location['coordinates'].get('lng')
    
    # Handle type field (if exists, store it but model doesn't have this field yet)
    if 'type' in data:
        # For now, we'll ignore it or store in description
        point_type = data.pop('type', 'both')
        if not data.get('description'):
            data['description'] = f"Type: {point_type}"
    
    data['created_by'] = request.user.id
    # Auto-approve if admin, otherwise pending
    if is_admin:
        data['is_active'] = True
    else:
        data['is_active'] = False  # Pending approval
    
    serializer = FeedingPointSerializer(data=data)
    if serializer.is_valid():
        feeding_point = serializer.save()
        return Response({
            'message': 'Feeding point created successfully',
            'data': FeedingPointSerializer(feeding_point).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_feeding_point(request, point_id):
    """Admin can update a feeding point."""
    try:
        point = FeedingPoint.objects.get(id=point_id)
    except FeedingPoint.DoesNotExist:
        return Response(
            {'message': 'Feeding point not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = FeedingPointSerializer(point, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(FeedingPointSerializer(point).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_feeding_point(request, point_id):
    """Admin can delete a feeding point."""
    try:
        point = FeedingPoint.objects.get(id=point_id)
    except FeedingPoint.DoesNotExist:
        return Response(
            {'message': 'Feeding point not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    point.delete()
    return Response({'message': 'Feeding point deleted successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_feeding_record(request):
    """User can create a feeding record."""
    data = request.data.copy()
    data['user'] = request.user.id
    
    # Handle photos upload
    photos = []
    if 'photos' in request.FILES:
        from django.core.files.storage import default_storage
        for photo in request.FILES.getlist('photos'):
            path = default_storage.save(f'feeding/{photo.name}', photo)
            photos.append(default_storage.url(path))
    data['photos'] = photos
    
    serializer = FeedingRecordSerializer(data=data)
    if serializer.is_valid():
        feeding_record = serializer.save()
        return Response({
            'message': 'Feeding record created successfully',
            'feeding_record': FeedingRecordSerializer(feeding_record).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_feeding_records(request):
    """Get current user's feeding records."""
    records = FeedingRecord.objects.filter(user=request.user).order_by('-feeding_date')
    serializer = FeedingRecordSerializer(records, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def feeding_records_by_point(request, point_id):
    """Get feeding records for a specific feeding point."""
    try:
        point = FeedingPoint.objects.get(id=point_id, is_active=True)
    except FeedingPoint.DoesNotExist:
        return Response(
            {'message': 'Feeding point not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    records = FeedingRecord.objects.filter(feeding_point=point).order_by('-feeding_date')
    serializer = FeedingRecordSerializer(records, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelters_accepting_feeding(request):
    """Get shelters that accept feeding data."""
    shelters = Shelter.objects.filter(accepts_feeding=True, is_verified=True)
    from .serializers import ShelterSerializer
    serializer = ShelterSerializer(shelters, many=True)
    return Response(serializer.data)

