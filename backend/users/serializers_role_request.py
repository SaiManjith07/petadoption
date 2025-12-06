from rest_framework import serializers
from .models_role_request import RoleRequest
from .serializers import UserSerializer


class RoleRequestSerializer(serializers.ModelSerializer):
    """Serializer for RoleRequest model"""
    user_name = serializers.CharField(source='user.name', read_only=True, allow_null=True)
    user_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True, allow_null=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True, allow_null=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True, allow_null=True)
    days_since_created = serializers.SerializerMethodField()
    is_pending = serializers.SerializerMethodField()

    class Meta:
        model = RoleRequest
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_phone', 'requested_role',
            'reason', 'experience', 'availability', 'resources',
            'status', 'reviewed_by', 'reviewed_by_name', 'reviewed_by_email', 'reviewed_at',
            'review_notes', 'created_at', 'updated_at', 'days_since_created', 'is_pending'
        ]
        read_only_fields = ['user', 'status', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']

    def get_days_since_created(self, obj):
        """Calculate days since request was created"""
        if obj.created_at:
            from django.utils import timezone
            delta = timezone.now() - obj.created_at
            return delta.days
        return None

    def get_is_pending(self, obj):
        """Check if request is pending"""
        return obj.status == 'pending'

    def validate_requested_role(self, value):
        """Validate requested role"""
        valid_roles = [choice[0] for choice in RoleRequest.ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        return value

    def validate(self, attrs):
        """Additional validation"""
        # Check if user already has this role (only if request context is available)
        if self.instance is None and 'request' in self.context:  # Only check on creation
            user = self.context['request'].user
            requested_role = attrs.get('requested_role')
            
            if user and requested_role:
                # Check if user already has this role
                if user.role == requested_role:
                    raise serializers.ValidationError(
                        {'requested_role': f'You already have the {requested_role} role.'}
                    )
                
                # Check if there's already a pending request for this role
                existing = RoleRequest.objects.filter(
                    user=user,
                    requested_role=requested_role,
                    status='pending'
                ).exists()
                
                if existing:
                    raise serializers.ValidationError(
                        {'requested_role': f'You already have a pending request for {requested_role} role.'}
                    )
        
        return attrs

