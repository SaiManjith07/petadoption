from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.db.models import Q
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
# from django.core.mail import send_mail  # Uncomment when email is configured
# from django.conf import settings  # Uncomment when email is configured
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer, UserUpdateSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint."""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login endpoint."""
    import traceback
    from django.conf import settings
    
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'message': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use email as username for authentication
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            # Try to find if user exists to provide better error message
            try:
                user_obj = User.objects.get(email__iexact=email)
                if not user_obj.is_active:
                    return Response(
                        {'message': 'User account is disabled'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except User.DoesNotExist:
                pass
            
            return Response(
                {'message': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'message': 'User account is disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)
        
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        # Log the full error for debugging
        error_trace = traceback.format_exc()
        print(f"[LOGIN ERROR] Exception: {str(e)}")
        print(f"[LOGIN ERROR] Traceback: {error_trace}")
        
        # Return a safe error response
        error_response = {
            'message': 'An error occurred during login',
            'error': str(e) if settings.DEBUG else 'Internal server error'
        }
        
        if settings.DEBUG:
            error_response['traceback'] = error_trace
        
        return Response(
            error_response,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user."""
    serializer = UserSerializer(request.user)
    return Response({'user': serializer.data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_email(request):
    """Check if email is available."""
    email = request.query_params.get('email')
    if not email:
        return Response({'exists': False}, status=status.HTTP_200_OK)
    
    exists = User.objects.filter(email__iexact=email).exists()
    return Response({'exists': exists}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_phone(request):
    """Check if phone is available."""
    phone = request.query_params.get('phone')
    if not phone:
        return Response({'exists': False}, status=status.HTTP_200_OK)
    
    exists = User.objects.filter(phone=phone).exists()
    return Response({'exists': exists}, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for retrieving and updating user profile."""
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return UserUpdateSerializer


class UserListView(generics.ListAPIView):
    """List all users (admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        
        if role:
            queryset = queryset.filter(role=role)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user by blacklisting refresh token."""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Successfully logged out'},
                status=status.HTTP_200_OK
            )
        return Response(
            {'message': 'Refresh token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'message': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password."""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response(
            {'message': 'Current password and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify current password
    if not user.check_password(current_password):
        return Response(
            {'message': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password
    from django.contrib.auth.password_validation import validate_password
    try:
        validate_password(new_password, user)
    except Exception as e:
        return Response(
            {'message': '; '.join(e.messages) if hasattr(e, 'messages') else str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response(
        {'message': 'Password changed successfully'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Request password reset - sends reset token to email."""
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'message': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return Response(
            {'message': 'If an account with that email exists, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )
    
    # Generate reset token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # In a real app, you would send an email here
    # For now, we'll return the token in the response (for development)
    # In production, remove the token from response and send via email
    
    reset_url = f"{request.scheme}://{request.get_host()}/auth/reset-password?uid={uid}&token={token}"
    
    # TODO: Send email with reset link
    # send_mail(
    #     subject='Password Reset Request',
    #     message=f'Click the link to reset your password: {reset_url}',
    #     from_email=settings.DEFAULT_FROM_EMAIL,
    #     recipient_list=[user.email],
    #     fail_silently=False,
    # )
    
    return Response(
        {
            'message': 'Password reset instructions have been sent to your email.',
            'uid': uid,
            'token': token,  # Remove in production - only for development
            'reset_url': reset_url,  # Remove in production
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password using token."""
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not all([uid, token, new_password, confirm_password]):
        return Response(
            {'message': 'All fields are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_password != confirm_password:
        return Response(
            {'message': 'Passwords do not match'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {'message': 'Invalid reset link'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify token
    if not default_token_generator.check_token(user, token):
        return Response(
            {'message': 'Invalid or expired reset token'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password
    from django.contrib.auth.password_validation import validate_password
    try:
        validate_password(new_password, user)
    except Exception as e:
        return Response(
            {'message': '; '.join(e.messages) if hasattr(e, 'messages') else str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response(
        {'message': 'Password has been reset successfully. You can now login with your new password.'},
        status=status.HTTP_200_OK
    )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view for user management."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Only admin can access
        from rest_framework.permissions import IsAdminUser
        return [IsAdminUser()]
    
    def perform_destroy(self, instance):
        # Soft delete - deactivate instead of delete
        instance.is_active = False
        instance.save()

