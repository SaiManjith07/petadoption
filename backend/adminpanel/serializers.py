from rest_framework import serializers
from .models import AdminLog, SystemSettings, DashboardStats
from users.serializers import UserSerializer


class AdminLogSerializer(serializers.ModelSerializer):
    """Serializer for AdminLog model."""
    admin = UserSerializer(read_only=True)

    class Meta:
        model = AdminLog
        fields = [
            'id', 'admin', 'action', 'model_type', 'object_id',
            'description', 'changes', 'ip_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for SystemSettings model."""
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = SystemSettings
        fields = ['id', 'key', 'value', 'description', 'updated_by', 'updated_at']
        read_only_fields = ['id', 'updated_at', 'updated_by']


class DashboardStatsSerializer(serializers.ModelSerializer):
    """Serializer for DashboardStats model."""
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = DashboardStats
        fields = [
            'id', 'total_pets', 'pending_pets', 'found_pets', 'lost_pets',
            'available_pets', 'adopted_pets', 'total_users', 'active_users',
            'total_applications', 'pending_applications', 'total_chats',
            'active_chats', 'pending_chat_requests', 'pets_last_7_days',
            'users_last_7_days', 'last_updated', 'updated_by'
        ]
        read_only_fields = ['id', 'last_updated']
