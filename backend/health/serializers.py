from rest_framework import serializers
from .models import VaccinationCamp, CampRegistration, HealthResource
from users.serializers import UserSerializer


class VaccinationCampSerializer(serializers.ModelSerializer):
    """Serializer for VaccinationCamp model"""
    is_upcoming = serializers.ReadOnlyField()
    available_slots = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = VaccinationCamp
        fields = [
            'id', 'location', 'address', 'city', 'state', 'pincode',
            'date', 'start_time', 'end_time', 'ngo', 'ngo_contact', 'ngo_email',
            'description', 'registration_link', 'max_capacity', 'current_registrations',
            'is_active', 'is_upcoming', 'available_slots', 'is_full',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'current_registrations', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Format time fields for frontend"""
        data = super().to_representation(instance)
        if instance.start_time and instance.end_time:
            data['time'] = f"{instance.start_time.strftime('%I:%M %p')} - {instance.end_time.strftime('%I:%M %p')}"
        return data


class CampRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for CampRegistration model"""
    camp_details = VaccinationCampSerializer(source='camp', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = CampRegistration
        fields = [
            'id', 'camp', 'camp_details', 'user', 'user_name', 'user_email',
            'pet_name', 'pet_type', 'pet_age', 'contact_phone', 'contact_email',
            'notes', 'status', 'registered_at', 'updated_at'
        ]
        read_only_fields = ['user', 'registered_at', 'updated_at']

    def validate(self, data):
        """Validate registration"""
        camp = data.get('camp')
        if camp:
            if not camp.is_active:
                raise serializers.ValidationError("This camp is no longer active.")
            if camp.is_full:
                raise serializers.ValidationError("This camp is full. No more registrations accepted.")
            if not camp.is_upcoming:
                raise serializers.ValidationError("Cannot register for past camps.")
        return data

    def create(self, validated_data):
        """Create registration and update camp capacity"""
        registration = super().create(validated_data)
        # Update camp registration count
        camp = registration.camp
        camp.current_registrations += 1
        camp.save(update_fields=['current_registrations'])
        return registration


class HealthResourceSerializer(serializers.ModelSerializer):
    """Serializer for HealthResource model"""
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HealthResource
        fields = [
            'id', 'title', 'resource_type', 'content', 'short_description',
            'image', 'image_url', 'external_link', 'is_featured',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        """Get full URL for image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

