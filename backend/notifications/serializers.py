from rest_framework import serializers
from .models import Notification
from users.serializers import UserSerializer
from pets.serializers import PetListSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    related_pet = PetListSerializer(read_only=True, required=False, allow_null=True)
    related_user = UserSerializer(read_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'link_target',
            'is_read', 'created_at', 'related_pet', 'related_user'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications."""
    
    class Meta:
        model = Notification
        fields = [
            'user', 'title', 'message', 'notification_type', 'link_target',
            'related_pet', 'related_user'
        ]

