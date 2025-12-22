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
        fields = ['id', 'image', 'image_url', 'cloudinary_url', 'cloudinary_public_id', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_image_url(self, obj):
        """Get image URL - ONLY from Cloudinary."""
        try:
            # ONLY use Cloudinary URL - no local storage
            if obj.cloudinary_url:
                return obj.cloudinary_url
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
            'image', 'image_url', 'cloudinary_url', 'cloudinary_public_id', 'owner', 'posted_by', 'images', 'photos',
            'created_at', 'updated_at', 'is_verified', 'is_featured', 'views_count',
            'current_location_type', 'current_location_id', 'found_date', 'days_in_care',
            'moved_to_adoption', 'moved_to_adoption_date', 'owner_consent_for_adoption',
            'is_reunited', 'reunited_with_owner', 'reunited_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'views_count', 'owner', 'posted_by', 'adoption_status', 'is_verified']

    def get_image_url(self, obj):
        """Get full URL for the main pet image - ONLY from Cloudinary."""
        try:
            # ONLY use Cloudinary URL - no local storage
            if obj.cloudinary_url:
                return obj.cloudinary_url
            
            # Fallback: image_url field (for external images only, not local files)
            if obj.image_url:
                return obj.image_url
            
            return None
        except Exception as e:
            print(f"Error in PetSerializer.get_image_url: {e}")
            return None

    def get_photos(self, obj):
        """Get all photos as an array of URLs - ONLY from Cloudinary."""
        photos = []
        
        # Add main image if available (Cloudinary only)
        main_image_url = self.get_image_url(obj)
        if main_image_url:
            photos.append(main_image_url)
        
        # Add images from PetImage model (Cloudinary only)
        if hasattr(obj, 'images'):
            try:
                for img in obj.images.all():
                    # ONLY use Cloudinary URL - no local storage
                    if img.cloudinary_url:
                        photos.append(img.cloudinary_url)
            except Exception as e:
                print(f"Error iterating PetImages: {e}")
        
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
        
        # CRITICAL: Remove adoption_status and is_verified from validated_data if they exist
        # These should ONLY be set in perform_create, not in serializer
        # This prevents the model default ('Available for Adoption') from being used
        validated_data.pop('adoption_status', None)
        validated_data.pop('is_verified', None)
        
        # Set posted_by to current user if available in context
        # If posted_by is already set (e.g., from perform_create), don't override it
        if 'posted_by' not in validated_data and 'request' in self.context:
            try:
                validated_data['posted_by'] = self.context['request'].user
            except (KeyError, AttributeError):
                pass
        
        # IMPORTANT: Set default status to 'Pending' to prevent model default ('Available for Adoption') from being used
        # perform_create will call serializer.save() with explicit values, which will override this
        # But if for some reason perform_create doesn't set it, at least it won't be 'Available for Adoption'
        if 'adoption_status' not in validated_data:
            validated_data['adoption_status'] = 'Pending'
        if 'is_verified' not in validated_data:
            validated_data['is_verified'] = False
        
        # Create instance
        instance = super().create(validated_data)
        
        # Log what was created
        print(f"[DEBUG] PetSerializer.create: Created pet ID {instance.id} with status={instance.adoption_status}, is_verified={instance.is_verified}, found_date={getattr(instance, 'found_date', None)}")
        
        return instance


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
            'image', 'image_url', 'cloudinary_url', 'cloudinary_public_id', 'images', 'photos', 'posted_by',
            'created_at', 'updated_at', 'is_verified', 'is_featured', 'views_count'
        ]

    def get_image_url(self, obj):
        """Get full URL for the main pet image - ONLY from Cloudinary."""
        try:
            # ONLY use Cloudinary URL - no local storage
            if obj.cloudinary_url:
                return obj.cloudinary_url
            
            # Fallback: image_url field (for external images only, not local files)
            if obj.image_url:
                return obj.image_url
            
            return None
        except Exception:
            return None

    def get_photos(self, obj):
        """Get all photos as an array of URLs - ONLY from Cloudinary."""
        photos = []
        
        # Add main image if available (Cloudinary only)
        main_image_url = self.get_image_url(obj)
        if main_image_url:
            photos.append(main_image_url)
        
        # Add images from PetImage model (Cloudinary only)
        if hasattr(obj, 'images'):
            for img in obj.images.all():
                # ONLY use Cloudinary URL - no local storage
                if img.cloudinary_url:
                    photos.append(img.cloudinary_url)
        
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

