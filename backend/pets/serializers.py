from rest_framework import serializers
from django.conf import settings
from .models import Category, Pet, PetImage, AdoptionApplication, MedicalRecord
from users.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']


class PetImageSerializer(serializers.ModelSerializer):
    """Serializer for PetImage model."""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PetImage
        fields = ['id', 'image', 'image_url', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_image_url(self, obj):
        try:
            if obj.image:
                request = self.context.get('request')
                if request:
                    try:
                        if hasattr(obj.image, 'url'):
                            return request.build_absolute_uri(obj.image.url)
                    except (ValueError, AttributeError):
                        return None
            return None
        except Exception:
            return None


class PetSerializer(serializers.ModelSerializer):
    """Serializer for Pet model."""
    category = CategorySerializer(read_only=True, required=False, allow_null=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    owner = UserSerializer(read_only=True, required=False, allow_null=True)
    posted_by = UserSerializer(read_only=True, required=False, allow_null=True)
    images = PetImageSerializer(many=True, read_only=True, required=False)
    image_url = serializers.SerializerMethodField()
    photos = serializers.SerializerMethodField()  # Combined photos array for frontend

    class Meta:
        model = Pet
        fields = [
            'id', 'name', 'breed', 'age', 'gender', 'size', 'weight', 'description',
            'category', 'category_id', 'adoption_status', 'location', 'pincode',
            'last_seen', 'tag_registration_number', 'location_map_url', 'location_latitude', 'location_longitude',
            'image', 'image_url', 'owner', 'posted_by', 'images', 'photos',
            'created_at', 'updated_at', 'is_verified', 'is_featured', 'views_count',
            'current_location_type', 'current_location_id', 'found_date', 'days_in_care',
            'moved_to_adoption', 'moved_to_adoption_date', 'owner_consent_for_adoption',
            'is_reunited', 'reunited_with_owner', 'reunited_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'views_count', 'owner', 'posted_by']

    def get_image_url(self, obj):
        """Get full URL for the main pet image."""
        try:
            request = self.context.get('request')
            
            # First, try the uploaded image field
            if obj.image:
                try:
                    if hasattr(obj.image, 'url'):
                        image_url = obj.image.url
                        
                        # Always prefer BACKEND_URL from settings for consistency
                        base_url = getattr(settings, 'BACKEND_URL', None)
                        
                        # If BACKEND_URL is set, use it (production)
                        if base_url and base_url != 'http://127.0.0.1:8000':
                            # Ensure path starts with /
                            if not image_url.startswith('/'):
                                image_url = '/' + image_url
                            # Remove trailing slash from base_url if present
                            if base_url.endswith('/'):
                                base_url = base_url.rstrip('/')
                            return f"{base_url}{image_url}"
                        
                        # Fallback to request.build_absolute_uri if available (development)
                        if request:
                            full_url = request.build_absolute_uri(image_url)
                            return full_url
                        
                        # If already a full URL, return as is
                        if image_url.startswith('http://') or image_url.startswith('https://'):
                            return image_url
                        
                        # Last resort: construct URL from default
                        if not image_url.startswith('/'):
                            image_url = '/' + image_url
                        default_base = 'http://127.0.0.1:8000'
                        return f"{default_base}{image_url}"
                except (ValueError, AttributeError) as e:
                    import traceback
                    print(f"Error getting image URL: {e}")
                    if getattr(settings, 'DEBUG', False):
                        print(traceback.format_exc())
                    pass
            
            # If no uploaded image, try the image_url field (external URL)
            if obj.image_url:
                return obj.image_url
            
            return None
        except Exception as e:
            import traceback
            print(f"Error in get_image_url: {e}")
            if getattr(settings, 'DEBUG', False):
                print(traceback.format_exc())
            return None

    def get_photos(self, obj):
        """Get all photos as an array of URLs for frontend compatibility."""
        photos = []
        request = self.context.get('request')
        
        # Add main image if available
        main_image_url = self.get_image_url(obj)
        if main_image_url:
            photos.append(main_image_url)
        
        # Add images from PetImage model
        if hasattr(obj, 'images'):
            for img in obj.images.all():
                if img.image:
                    try:
                        if hasattr(img.image, 'url'):
                            image_url = img.image.url
                            
                            # Always prefer BACKEND_URL from settings for consistency
                            base_url = getattr(settings, 'BACKEND_URL', None)
                            
                            # If BACKEND_URL is set, use it (production)
                            if base_url and base_url != 'http://127.0.0.1:8000':
                                if not image_url.startswith('/'):
                                    image_url = '/' + image_url
                                if base_url.endswith('/'):
                                    base_url = base_url.rstrip('/')
                                photos.append(f"{base_url}{image_url}")
                            # Fallback to request.build_absolute_uri if available
                            elif request:
                                full_url = request.build_absolute_uri(image_url)
                                photos.append(full_url)
                            # If already a full URL, return as is
                            elif image_url.startswith('http://') or image_url.startswith('https://'):
                                photos.append(image_url)
                            # Last resort: construct from default
                            else:
                                if not image_url.startswith('/'):
                                    image_url = '/' + image_url
                                default_base = 'http://127.0.0.1:8000'
                                photos.append(f"{default_base}{image_url}")
                    except (ValueError, AttributeError) as e:
                        import traceback
                        print(f"Error getting PetImage URL: {e}")
                        if getattr(settings, 'DEBUG', False):
                            print(traceback.format_exc())
                        pass
                # Also check if PetImage has image_url field
                if hasattr(img, 'image_url') and img.image_url:
                    photos.append(img.image_url)
        
        return photos

    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id:
            from .models import Category
            try:
                # Ensure category_id is an integer
                if isinstance(category_id, str):
                    category_id = int(category_id)
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except (Category.DoesNotExist, ValueError, TypeError) as e:
                # Log error but continue without category (it's optional)
                import traceback
                print(f"Error setting category in PetSerializer.create: {e}")
                if getattr(settings, 'DEBUG', False):
                    print(traceback.format_exc())
                pass
        
        # Set posted_by to current user if available in context
        # If posted_by is already set (e.g., from perform_create), don't override it
        if 'posted_by' not in validated_data and 'request' in self.context:
            try:
                validated_data['posted_by'] = self.context['request'].user
            except (KeyError, AttributeError):
                pass
        
        return super().create(validated_data)


class PetListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for pet lists."""
    category = CategorySerializer(read_only=True, required=False, allow_null=True)
    posted_by = UserSerializer(read_only=True, required=False, allow_null=True)
    images = PetImageSerializer(many=True, read_only=True, required=False)
    image_url = serializers.SerializerMethodField()
    photos = serializers.SerializerMethodField()  # Combined photos array for frontend

    class Meta:
        model = Pet
        fields = [
            'id', 'name', 'breed', 'age', 'gender', 'size', 'weight', 'description',
            'category', 'adoption_status', 'location', 'pincode', 'last_seen',
            'tag_registration_number', 'location_map_url', 'location_latitude', 'location_longitude',
            'image', 'image_url', 'images', 'photos', 'posted_by',
            'created_at', 'updated_at', 'is_verified', 'is_featured', 'views_count'
        ]

    def get_image_url(self, obj):
        """Get full URL for the main pet image."""
        try:
            request = self.context.get('request')
            
            # First, try the uploaded image field
            if obj.image:
                try:
                    if hasattr(obj.image, 'url'):
                        image_url = obj.image.url
                        
                        # Always prefer BACKEND_URL from settings for consistency
                        base_url = getattr(settings, 'BACKEND_URL', None)
                        
                        # If BACKEND_URL is set, use it (production)
                        if base_url and base_url != 'http://127.0.0.1:8000':
                            if not image_url.startswith('/'):
                                image_url = '/' + image_url
                            if base_url.endswith('/'):
                                base_url = base_url.rstrip('/')
                            return f"{base_url}{image_url}"
                        
                        # Fallback to request.build_absolute_uri if available
                        if request:
                            return request.build_absolute_uri(image_url)
                        
                        # If already a full URL, return as is
                        if image_url.startswith('http://') or image_url.startswith('https://'):
                            return image_url
                        
                        # Last resort: return relative URL
                        return image_url
                except (ValueError, AttributeError):
                    pass
            
            # If no uploaded image, try the image_url field (external URL)
            if obj.image_url:
                return obj.image_url
            
            return None
        except Exception:
            return None

    def get_photos(self, obj):
        """Get all photos as an array of URLs for frontend compatibility."""
        photos = []
        request = self.context.get('request')
        
        # Add main image if available
        main_image_url = self.get_image_url(obj)
        if main_image_url:
            photos.append(main_image_url)
        
        # Add images from PetImage model
        if hasattr(obj, 'images'):
            for img in obj.images.all():
                if img.image:
                    try:
                        if hasattr(img.image, 'url'):
                            image_url = img.image.url
                            
                            # Always prefer BACKEND_URL from settings
                            base_url = getattr(settings, 'BACKEND_URL', None)
                            
                            # If BACKEND_URL is set, use it (production)
                            if base_url and base_url != 'http://127.0.0.1:8000':
                                if not image_url.startswith('/'):
                                    image_url = '/' + image_url
                                if base_url.endswith('/'):
                                    base_url = base_url.rstrip('/')
                                photos.append(f"{base_url}{image_url}")
                            # Fallback to request.build_absolute_uri
                            elif request:
                                photos.append(request.build_absolute_uri(image_url))
                            # If already full URL
                            elif image_url.startswith('http://') or image_url.startswith('https://'):
                                photos.append(image_url)
                            # Last resort
                            else:
                                photos.append(image_url)
                    except (ValueError, AttributeError):
                        pass
        
        return photos


class AdoptionApplicationSerializer(serializers.ModelSerializer):
    """Serializer for AdoptionApplication model."""
    applicant = UserSerializer(read_only=True)
    pet = PetListSerializer(read_only=True)
    pet_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = AdoptionApplication
        fields = [
            'id', 'pet', 'pet_id', 'applicant', 'message', 'status',
            'applied_at', 'reviewed_at', 'reviewed_by'
        ]
        read_only_fields = ['id', 'applicant', 'applied_at', 'reviewed_at', 'reviewed_by']

    def create(self, validated_data):
        validated_data['applicant'] = self.context['request'].user
        return super().create(validated_data)


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer for MedicalRecord model."""
    registered_by = UserSerializer(read_only=True)
    pet = PetListSerializer(read_only=True)
    pet_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'pet', 'pet_id', 'registered_by', 'health_status', 'weight', 'temperature',
            'vaccination_status', 'last_vaccination_date', 'next_vaccination_due', 'vaccination_notes',
            'medical_history', 'current_medications', 'allergies', 'chronic_conditions',
            'veterinarian_name', 'veterinarian_contact', 'clinic_name',
            'is_spayed_neutered', 'spay_neuter_date', 'notes',
            'created_at', 'updated_at', 'last_checkup_date', 'next_checkup_due'
        ]
        read_only_fields = ['id', 'registered_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['registered_by'] = self.context['request'].user
        return super().create(validated_data)

