from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Q
from .models import User, Volunteer, Shelter
from .serializers import VolunteerSerializer, ShelterSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_volunteer(request):
    """Register as a volunteer."""
    user = request.user
    
    # Check if already registered
    if hasattr(user, 'volunteer_profile'):
        return Response(
            {'message': 'You are already registered as a volunteer'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = request.data.copy()
    data['user_id'] = user.id
    
    serializer = VolunteerSerializer(data=data)
    if serializer.is_valid():
        volunteer = serializer.save()
        user.is_volunteer = True
        user.save()
        
        return Response({
            'message': 'Volunteer registration submitted. Waiting for admin verification.',
            'volunteer': VolunteerSerializer(volunteer).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_shelter(request):
    """Register a shelter."""
    user = request.user
    
    data = request.data.copy()
    data['user_id'] = user.id
    
    # Ensure is_verified is False for new registrations
    data['is_verified'] = False
    
    serializer = ShelterSerializer(data=data)
    if serializer.is_valid():
        shelter = serializer.save()
        # Explicitly set is_verified to False for new registrations
        shelter.is_verified = False
        shelter.save()
        user.is_shelter_provider = True
        user.save()
        
        return Response({
            'message': 'Shelter registration submitted. Waiting for admin verification.',
            'shelter': ShelterSerializer(shelter, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_volunteer_profile(request):
    """Get current user's volunteer profile."""
    if not hasattr(request.user, 'volunteer_profile'):
        return Response(
            {'message': 'You are not registered as a volunteer'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = VolunteerSerializer(request.user.volunteer_profile)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_shelters(request):
    """Get current user's shelters."""
    shelters = Shelter.objects.filter(user=request.user)
    serializer = ShelterSerializer(shelters, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def nearby_shelters(request):
    """Get nearby shelters based on pincode or location."""
    pincode = request.query_params.get('pincode')
    city = request.query_params.get('city')
    latitude = request.query_params.get('latitude')
    longitude = request.query_params.get('longitude')
    
    queryset = Shelter.objects.filter(is_verified=True)
    
    if pincode:
        queryset = queryset.filter(pincode=pincode)
    if city:
        queryset = queryset.filter(city__icontains=city)
    
    # TODO: Add distance calculation if lat/long provided
    
    serializer = ShelterSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def nearby_volunteers(request):
    """Get nearby volunteers who can provide shelter."""
    pincode = request.query_params.get('pincode')
    city = request.query_params.get('city')
    
    queryset = Volunteer.objects.filter(
        can_provide_shelter=True,
        user__volunteer_verified=True
    ).select_related('user')
    
    if pincode:
        queryset = queryset.filter(user__pincode=pincode)
    if city:
        queryset = queryset.filter(user__address__icontains=city)
    
    serializer = VolunteerSerializer(queryset, many=True)
    return Response(serializer.data)


# Admin endpoints
@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_volunteers(request):
    """Get pending volunteer registrations."""
    volunteers = Volunteer.objects.filter(verified_by__isnull=True)
    serializer = VolunteerSerializer(volunteers, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def verify_volunteer(request, volunteer_id):
    """Verify a volunteer."""
    try:
        volunteer = Volunteer.objects.get(id=volunteer_id)
    except Volunteer.DoesNotExist:
        return Response(
            {'message': 'Volunteer not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    approved = request.data.get('approved', False)
    notes = request.data.get('notes', '')
    
    if approved:
        volunteer.verified_by = request.user
        volunteer.user.volunteer_verified = True
        volunteer.user.save()
        volunteer.verification_notes = notes
        volunteer.save()
        
        return Response({
            'message': 'Volunteer verified successfully',
            'volunteer': VolunteerSerializer(volunteer).data
        })
    else:
        volunteer.verification_notes = notes
        volunteer.save()
        return Response({
            'message': 'Volunteer verification rejected',
            'volunteer': VolunteerSerializer(volunteer).data
        })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_shelters(request):
    """Get pending shelter registrations."""
    shelters = Shelter.objects.filter(is_verified=False)
    serializer = ShelterSerializer(shelters, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def verify_shelter(request, shelter_id):
    """Verify a shelter."""
    try:
        shelter = Shelter.objects.select_related('user', 'verified_by').get(id=shelter_id)
    except Shelter.DoesNotExist:
        return Response(
            {'message': 'Shelter not found', 'error': 'Shelter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in verify_shelter: {e}")
        print(traceback.format_exc())
        return Response(
            {'message': f'Error: {str(e)}', 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    approved = request.data.get('approved', False)
    notes = request.data.get('notes', '')
    verification_params = request.data.get('verification_params', {})
    
    try:
        if approved:
            # Check if at least 2 parameters are verified
            verified_count = sum(1 for v in verification_params.values() if v)
            if verified_count < 2:
                return Response(
                    {'message': 'At least 2 verification parameters must be checked', 'error': 'Insufficient verification parameters'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            from django.utils import timezone
            shelter.is_verified = True
            shelter.verified_by = request.user
            shelter.verified_at = timezone.now()
            
            # Update user's shelter verification status
            if shelter.user:
                shelter.user.shelter_verified = True
                shelter.user.save()
            
            shelter.verification_notes = notes
            
            # Store verification parameters in verification_notes as JSON if needed
            if verification_params:
                import json
                verification_info = {
                    'verification_params': verification_params,
                    'notes': notes,
                    'verified_count': verified_count
                }
                # Append verification info to notes or store separately
                if shelter.verification_notes:
                    shelter.verification_notes += f"\n\nVerification Details: {json.dumps(verification_info)}"
                else:
                    shelter.verification_notes = f"Verification Details: {json.dumps(verification_info)}"
            
            shelter.save()
            
            # Return updated shelter data with request context for serializer
            serializer = ShelterSerializer(shelter, context={'request': request})
            
            return Response({
                'message': 'Shelter verified successfully',
                'shelter': serializer.data,
                'verification_params': verification_params
            }, status=status.HTTP_200_OK)
        else:
            shelter.verification_notes = notes
            shelter.save()
            serializer = ShelterSerializer(shelter, context={'request': request})
            return Response({
                'message': 'Shelter verification rejected',
                'shelter': serializer.data
            }, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        print(f"Error processing shelter verification: {e}")
        print(traceback.format_exc())
        return Response(
            {'message': f'Error processing verification: {str(e)}', 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_shelter(request):
    """Admin can create a shelter directly."""
    serializer = ShelterSerializer(data=request.data)
    if serializer.is_valid():
        shelter = serializer.save()
        shelter.is_verified = True
        shelter.verified_by = request.user
        shelter.save()
        
        if shelter.user:
            shelter.user.is_shelter_provider = True
            shelter.user.shelter_verified = True
            shelter.user.save()
        
        return Response({
            'message': 'Shelter created and verified',
            'shelter': ShelterSerializer(shelter).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

