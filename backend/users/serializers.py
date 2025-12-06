from rest_framework import serializers
from .models import User, Volunteer, Shelter, FeedingPoint, FeedingRecord, AdminRegistration


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer."""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'phone', 'country_code',
            'pincode', 'age', 'gender', 'address', 'landmark', 'profile_image',
            'is_volunteer', 'is_shelter_provider', 'volunteer_verified', 'shelter_verified',
            'admin_level', 'region', 'is_staff', 'is_superuser',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_staff', 'is_superuser']


class VolunteerSerializer(serializers.ModelSerializer):
    """Volunteer profile serializer."""
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Volunteer
        fields = [
            'id', 'user', 'user_id', 'ngo_name', 'experience_years', 'skills',
            'availability', 'can_provide_shelter', 'shelter_capacity', 'shelter_area_sqft',
            'verified_by', 'verified_at', 'verification_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'verified_by', 'verified_at', 'created_at', 'updated_at']


class ShelterSerializer(serializers.ModelSerializer):
    """Shelter serializer."""
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    available_capacity = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()
    shelter_name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    contact_info = serializers.SerializerMethodField()
    capacity = serializers.SerializerMethodField()
    
    class Meta:
        model = Shelter
        fields = [
            'id', 'user', 'user_id', 'name', 'shelter_name', 'address', 'city', 'state', 'pincode',
            'phone', 'email', 'total_capacity', 'capacity', 'current_occupancy', 'available_capacity',
            'area_sqft', 'accepts_feeding', 'facilities', 'is_verified', 'status', 'verified_by',
            'verified_at', 'verification_notes', 'latitude', 'longitude', 'location', 'contact_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'verified_by', 'verified_at', 'created_at', 'updated_at']
    
    def get_status(self, obj):
        """Return status based on is_verified."""
        if obj.is_verified:
            return 'approved'
        return 'pending'
    
    def get_shelter_name(self, obj):
        """Return name as shelter_name for frontend compatibility."""
        return obj.name
    
    def get_location(self, obj):
        """Format location as nested object for frontend compatibility."""
        return {
            'address': obj.address or '',
            'city': obj.city or '',
            'state': obj.state or '',
            'pincode': obj.pincode or '',
            'latitude': float(obj.latitude) if obj.latitude else None,
            'longitude': float(obj.longitude) if obj.longitude else None,
        }
    
    def get_contact_info(self, obj):
        """Format contact info as nested object for frontend compatibility."""
        return {
            'phone': obj.phone or '',
            'email': obj.email or '',
        }
    
    def get_capacity(self, obj):
        """Return total_capacity as capacity for frontend compatibility."""
        return obj.total_capacity
    
    def create(self, validated_data):
        """Handle nested location and contact_info data from frontend."""
        # Extract nested location data if present
        location_data = validated_data.pop('location', None)
        if location_data:
            validated_data['address'] = location_data.get('address', validated_data.get('address', ''))
            validated_data['city'] = location_data.get('city', validated_data.get('city', ''))
            validated_data['state'] = location_data.get('state', validated_data.get('state', ''))
            validated_data['pincode'] = location_data.get('pincode', validated_data.get('pincode', ''))
            if 'latitude' in location_data:
                validated_data['latitude'] = location_data['latitude']
            if 'longitude' in location_data:
                validated_data['longitude'] = location_data['longitude']
        
        # Extract nested contact_info data if present
        contact_info = validated_data.pop('contact_info', None)
        if contact_info:
            validated_data['phone'] = contact_info.get('phone', validated_data.get('phone', ''))
            validated_data['email'] = contact_info.get('email', validated_data.get('email', ''))
        
        # Extract capacity if provided as 'capacity' instead of 'total_capacity'
        if 'capacity' in validated_data and 'total_capacity' not in validated_data:
            validated_data['total_capacity'] = validated_data.pop('capacity')
        
        # Extract shelter_name if provided instead of 'name'
        if 'shelter_name' in validated_data and 'name' not in validated_data:
            validated_data['name'] = validated_data.pop('shelter_name')
        
        # Ensure is_verified is False for new registrations
        validated_data['is_verified'] = False
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Handle nested location and contact_info data from frontend during update."""
        # Extract nested location data if present
        location_data = validated_data.pop('location', None)
        if location_data:
            validated_data['address'] = location_data.get('address', instance.address)
            validated_data['city'] = location_data.get('city', instance.city)
            validated_data['state'] = location_data.get('state', instance.state)
            validated_data['pincode'] = location_data.get('pincode', instance.pincode)
            if 'latitude' in location_data:
                validated_data['latitude'] = location_data['latitude']
            if 'longitude' in location_data:
                validated_data['longitude'] = location_data['longitude']
        
        # Extract nested contact_info data if present
        contact_info = validated_data.pop('contact_info', None)
        if contact_info:
            validated_data['phone'] = contact_info.get('phone', instance.phone)
            validated_data['email'] = contact_info.get('email', instance.email)
        
        # Extract capacity if provided as 'capacity' instead of 'total_capacity'
        if 'capacity' in validated_data and 'total_capacity' not in validated_data:
            validated_data['total_capacity'] = validated_data.pop('capacity')
        
        # Extract shelter_name if provided instead of 'name'
        if 'shelter_name' in validated_data and 'name' not in validated_data:
            validated_data['name'] = validated_data.pop('shelter_name')
        
        return super().update(instance, validated_data)


class FeedingPointSerializer(serializers.ModelSerializer):
    """Feeding point serializer."""
    created_by = UserSerializer(read_only=True)
    location = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    
    class Meta:
        model = FeedingPoint
        fields = [
            'id', 'name', 'address', 'city', 'state', 'pincode', 'description',
            'contact_phone', 'contact_email', 'latitude', 'longitude',
            'created_by', 'is_active', 'created_at', 'updated_at', 'location', 'type'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_location(self, obj):
        """Format location as nested object for frontend compatibility."""
        try:
            lat = None
            lng = None
            if obj.latitude is not None:
                try:
                    lat = float(obj.latitude)
                except (ValueError, TypeError):
                    lat = None
            if obj.longitude is not None:
                try:
                    lng = float(obj.longitude)
                except (ValueError, TypeError):
                    lng = None
            
            return {
                'address': obj.address or '',
                'city': obj.city or '',
                'state': obj.state or '',
                'pincode': obj.pincode or '',
                'coordinates': {
                    'lat': lat,
                    'lng': lng,
                } if lat is not None and lng is not None else None
            }
        except Exception as e:
            # Return safe default if any error occurs
            return {
                'address': getattr(obj, 'address', '') or '',
                'city': getattr(obj, 'city', '') or '',
                'state': getattr(obj, 'state', '') or '',
                'pincode': getattr(obj, 'pincode', '') or '',
                'coordinates': None
            }
    
    def get_type(self, obj):
        """Extract type from description or default to 'both'."""
        try:
            if obj.description and 'Type:' in obj.description:
                try:
                    return obj.description.split('Type:')[1].strip().split()[0]
                except:
                    pass
        except:
            pass
        return 'both'  # Default type


class FeedingRecordSerializer(serializers.ModelSerializer):
    """Feeding record serializer."""
    user = UserSerializer(read_only=True)
    feeding_point = FeedingPointSerializer(read_only=True)
    shelter = ShelterSerializer(read_only=True)
    
    class Meta:
        model = FeedingRecord
        fields = [
            'id', 'user', 'feeding_point', 'shelter', 'menu', 'feeding_date',
            'number_of_pets', 'photos', 'notes', 'location_address',
            'latitude', 'longitude', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer."""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'name', 'password', 'confirm_password', 'role',
            'phone', 'country_code', 'pincode', 'age', 'gender', 'address', 'landmark'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """User update serializer."""
    
    class Meta:
        model = User
        fields = [
            'name', 'phone', 'country_code', 'pincode', 'age', 'gender',
            'address', 'landmark', 'profile_image'
        ]


class AdminRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for admin registration."""
    
    class Meta:
        model = AdminRegistration
        fields = [
            'id', 'email', 'name', 'phone', 'country_code', 'pincode',
            'region', 'organization', 'verification_pin', 'pin_sent_at',
            'pin_expires_at', 'is_verified', 'verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'verification_pin', 'pin_sent_at', 'pin_expires_at', 'is_verified', 'verified_at', 'created_at']
    
    def validate_email(self, value):
        """Check if email is already registered as user."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value


class AdminRegistrationRequestSerializer(serializers.Serializer):
    """Serializer for admin registration request."""
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=15)
    country_code = serializers.CharField(max_length=5, default='+91')
    pincode = serializers.CharField(max_length=10)
    region = serializers.CharField(max_length=255)
    organization = serializers.CharField(max_length=255, required=False, allow_blank=True)


class PINVerificationSerializer(serializers.Serializer):
    """Serializer for PIN verification."""
    email = serializers.EmailField()
    pin = serializers.CharField(max_length=6, min_length=6)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, data):
        """Validate password match."""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match."})
        return data
