from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db.models import Q
import random
from datetime import timedelta
from .models import User, AdminRegistration, AllowedAdminEmail
from .serializers import (
    AdminRegistrationSerializer, 
    AdminRegistrationRequestSerializer,
    PINVerificationSerializer,
    UserSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_admin_registration(request):
    """Request admin registration - generates and returns PIN (frontend will send via EmailJS)."""
    serializer = AdminRegistrationRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email'].lower()
    
    # Check if email is in the allowed admin emails list
    allowed_email = AllowedAdminEmail.objects.filter(email=email, is_active=True).first()
    if not allowed_email:
        return Response(
            {'message': 'This email is not eligible to register as admin.', 'eligible': False},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if email already exists as user
    if User.objects.filter(email=email).exists():
        return Response(
            {'message': 'This email is already registered as a user.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's a pending registration
    existing_reg = AdminRegistration.objects.filter(email=email, is_verified=False).first()
    
    # Generate 6-digit PIN
    pin = str(random.randint(100000, 999999))
    
    # Set expiration (15 minutes from now)
    expires_at = timezone.now() + timedelta(minutes=15)
    
    if existing_reg:
        # Update existing registration
        existing_reg.verification_pin = pin
        existing_reg.pin_sent_at = timezone.now()
        existing_reg.pin_expires_at = expires_at
        existing_reg.name = serializer.validated_data['name']
        existing_reg.phone = serializer.validated_data['phone']
        existing_reg.country_code = serializer.validated_data.get('country_code', '+91')
        existing_reg.pincode = serializer.validated_data['pincode']
        existing_reg.region = serializer.validated_data['region']
        existing_reg.organization = serializer.validated_data.get('organization', '')
        existing_reg.save()
        admin_reg = existing_reg
    else:
        # Create new registration
        admin_reg = AdminRegistration.objects.create(
            email=email,
            name=serializer.validated_data['name'],
            phone=serializer.validated_data['phone'],
            country_code=serializer.validated_data.get('country_code', '+91'),
            pincode=serializer.validated_data['pincode'],
            region=serializer.validated_data['region'],
            organization=serializer.validated_data.get('organization', ''),
            verification_pin=pin,
            pin_expires_at=expires_at
        )
    
    # Return PIN to frontend (frontend will send via EmailJS)
    return Response({
        'message': 'PIN generated successfully. Please check your email.',
        'pin': pin,  # Frontend will use this to send via EmailJS
        'email': email,
        'expires_at': expires_at.isoformat()
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_admin_pin(request):
    """Verify PIN and create admin user account."""
    serializer = PINVerificationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email'].lower()
    pin = serializer.validated_data['pin']
    password = serializer.validated_data['password']
    
    try:
        admin_reg = AdminRegistration.objects.get(email=email, verification_pin=pin, is_verified=False)
    except AdminRegistration.DoesNotExist:
        return Response(
            {'message': 'Invalid PIN or email.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if PIN is expired
    if admin_reg.is_pin_expired():
        return Response(
            {'message': 'PIN has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify PIN matches
    if admin_reg.verification_pin != pin:
        return Response(
            {'message': 'Invalid PIN.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create admin user
    user = User.objects.create_user(
        email=admin_reg.email,
        name=admin_reg.name,
        password=password,
        phone=admin_reg.phone,
        country_code=admin_reg.country_code,
        pincode=admin_reg.pincode,
        role='sub_admin',
        admin_level='sub_admin',
        region=admin_reg.region,
        is_staff=True,  # Give staff access
        is_active=True
    )
    
    # Mark registration as verified
    admin_reg.is_verified = True
    admin_reg.verified_at = timezone.now()
    admin_reg.save()
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    user_serializer = UserSerializer(user)
    
    return Response({
        'message': 'Admin account created successfully!',
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_admins(request):
    """List all admins (super admin only)."""
    if not request.user.is_superuser:
        return Response(
            {'message': 'Only super admins can view admin list.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    admins = User.objects.filter(
        Q(is_staff=True) | Q(admin_level__in=['super_admin', 'admin', 'sub_admin'])
    ).exclude(id=request.user.id)
    
    serializer = UserSerializer(admins, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_admin(request, user_id):
    """Remove admin (super admin only)."""
    if not request.user.is_superuser:
        return Response(
            {'message': 'Only super admins can remove admins.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        admin_user = User.objects.get(id=user_id)
        
        # Don't allow removing super admins
        if admin_user.is_superuser:
            return Response(
                {'message': 'Cannot remove super admin.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Don't allow removing yourself
        if admin_user.id == request.user.id:
            return Response(
                {'message': 'Cannot remove yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove admin privileges
        admin_user.is_staff = False
        admin_user.admin_level = None
        admin_user.role = 'user'
        admin_user.save()
        
        return Response(
            {'message': f'Admin {admin_user.name} has been removed successfully.'},
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        return Response(
            {'message': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_admin_level(request, user_id):
    """Update admin level (super admin only)."""
    if not request.user.is_superuser:
        return Response(
            {'message': 'Only super admins can update admin levels.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        admin_user = User.objects.get(id=user_id)
        new_level = request.data.get('admin_level')
        
        if new_level not in ['super_admin', 'admin', 'sub_admin']:
            return Response(
                {'message': 'Invalid admin level.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        admin_user.admin_level = new_level
        admin_user.role = new_level
        admin_user.is_staff = True
        admin_user.save()
        
        serializer = UserSerializer(admin_user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response(
            {'message': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

