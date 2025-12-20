from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.db.models import Q
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from .models import Pet, Category, AdoptionApplication, MedicalRecord
from .serializers import (
    PetSerializer, PetListSerializer, CategorySerializer,
    AdoptionApplicationSerializer, MedicalRecordSerializer
)


class CategoryListView(generics.ListAPIView):
    """List all categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class PetListView(generics.ListCreateAPIView):
    """List and create pets."""
    queryset = Pet.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'breed', 'description']
    ordering_fields = ['created_at', 'name', 'age']
    filterset_fields = ['adoption_status', 'category', 'gender', 'is_verified', 'is_featured']

    def get_permissions(self):
        # Allow anyone to list, but require authentication to create
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PetListSerializer
        return PetSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        try:
            # Automatically move found pets to adoption after 15 days (before filtering)
            from django.utils import timezone
            from datetime import timedelta
            
            cutoff_date = timezone.now() - timedelta(days=15)
            found_pets_to_move = Pet.objects.filter(
                adoption_status='Found',
                found_date__isnull=False,
                found_date__lte=cutoff_date,
                moved_to_adoption=False,
                is_reunited=False
            )
            
            for pet in found_pets_to_move:
                days = pet.calculate_days_in_care()
                if days >= 15:
                    pet.moved_to_adoption = True
                    pet.moved_to_adoption_date = timezone.now()
                    pet.adoption_status = 'Available for Adoption'
                    pet.owner_consent_for_adoption = True
                    pet.save()
            
            queryset = Pet.objects.select_related('category', 'owner', 'posted_by').prefetch_related('images')
            
            # Filter by status
            status_filter = self.request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(adoption_status=status_filter)
            
            # Filter by category
            category = self.request.query_params.get('category')
            if category:
                queryset = queryset.filter(category__name__icontains=category)
            
            # Filter by location (for lost/found)
            location = self.request.query_params.get('location')
            if location:
                queryset = queryset.filter(
                    Q(location__icontains=location) | Q(pincode__icontains=location)
                )
            
            return queryset
        except Exception as e:
            import traceback
            print(f"Error in PetListView.get_queryset: {e}")
            print(traceback.format_exc())
            return Pet.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(f"Error in PetListView.list: {e}")
            print(traceback.format_exc())
            return Response(
                {'error': str(e), 'detail': 'An error occurred while fetching pets'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)


class LostPetListView(generics.ListCreateAPIView):
    """List and create lost pets."""
    serializer_class = PetSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        try:
            return Pet.objects.filter(adoption_status='Lost').select_related('category', 'owner', 'posted_by').prefetch_related('images')
        except Exception as e:
            import traceback
            print(f"Error in LostPetListView.get_queryset: {e}")
            print(traceback.format_exc())
            return Pet.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in LostPetListView.list: {e}")
            print(error_trace)
            return Response(
                {'error': str(e), 'detail': 'An error occurred while fetching lost pets'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error handling."""
        try:
            # Handle species -> category mapping if species is provided
            # For FormData (QueryDict), we need to create a mutable copy
            from django.http import QueryDict
            
            # Get the data and make it mutable if it's a QueryDict
            data = request.data
            if isinstance(data, QueryDict):
                data = data.copy()  # This creates a mutable copy
            elif hasattr(data, '_mutable') and not data._mutable:
                data._mutable = True
            
            # Check if species is provided but category_id is not
            species = None
            if hasattr(data, 'get'):
                species_value = data.get('species', '')
                if isinstance(species_value, str):
                    species = species_value.strip()
                elif isinstance(species_value, list) and len(species_value) > 0:
                    species = str(species_value[0]).strip()
            
            # Map species to category_id if needed
            if species and not data.get('category_id'):
                try:
                    # Clean species name - remove "Lost" or "Found" prefix if present
                    species_cleaned = species.strip()
                    # Remove "Lost" or "Found" prefix (case-insensitive)
                    if species_cleaned.lower().startswith('lost '):
                        species_cleaned = species_cleaned[5:].strip()
                    elif species_cleaned.lower().startswith('found '):
                        species_cleaned = species_cleaned[6:].strip()
                    
                    # Normalize species name (capitalize first letter, rest lowercase)
                    species_normalized = species_cleaned.capitalize()
                    
                    # Try to find existing category (case-insensitive)
                    category = None
                    try:
                        category = Category.objects.get(name__iexact=species_normalized)
                    except Category.DoesNotExist:
                        # If not found, try exact match first
                        try:
                            category = Category.objects.get(name=species_normalized)
                        except Category.DoesNotExist:
                            # Create new category with normalized name (clean, no prefix)
                            category = Category.objects.create(
                                name=species_normalized,
                                description=f'Category for {species_normalized}'
                            )
                    
                    # Ensure category_id is an integer (serializer expects int)
                    data['category_id'] = int(category.id)
                    # Remove species from data as it's not a Pet model field
                    if 'species' in data:
                        if isinstance(data, QueryDict):
                            data.pop('species', None)
                        elif hasattr(data, 'pop'):
                            data.pop('species', None)
                        elif 'species' in data:
                            del data['species']
                except Exception as cat_error:
                    import traceback
                    print(f"Error creating/finding category for species '{species}': {cat_error}")
                    print(traceback.format_exc())
                    # Continue without category - it's optional
            
            # Make sure name field is present (required field)
            if not data.get('name'):
                return Response(
                    {
                        'error': 'Validation failed',
                        'detail': 'Name field is required',
                        'errors': {'name': ['This field is required.']}
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                # Return validation errors with details
                return Response(
                    {
                        'error': 'Validation failed',
                        'detail': 'Please check the form data',
                        'errors': serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                self.perform_create(serializer)
                # Get the created instance
                instance = serializer.instance
                # Re-serialize with request context to ensure proper URL generation
                try:
                    response_serializer = self.get_serializer(instance, context={'request': request})
                    response_data = response_serializer.data
                    headers = self.get_success_headers(response_data)
                    return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
                except Exception as serialize_error:
                    import traceback
                    error_trace = traceback.format_exc()
                    print(f"Error serializing created pet response: {serialize_error}")
                    print(error_trace)
                    # Fallback: return basic data without full serialization
                    basic_data = {
                        'id': instance.id if instance else None,
                        'name': instance.name if instance else None,
                        'adoption_status': instance.adoption_status if instance else 'Lost',
                        'message': 'Pet created successfully, but some data could not be serialized'
                    }
                    if instance:
                        basic_data['created_at'] = instance.created_at.isoformat() if hasattr(instance, 'created_at') and instance.created_at else None
                    return Response(
                        basic_data,
                        status=status.HTTP_201_CREATED
                    )
            except Exception as save_error:
                import traceback
                error_trace = traceback.format_exc()
                print(f"Error in LostPetListView.perform_create: {save_error}")
                print(error_trace)
                return Response(
                    {
                        'error': str(save_error),
                        'detail': 'Failed to save pet data. Please check the server logs for details.',
                        'traceback': error_trace if getattr(settings, 'DEBUG', False) else None
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in LostPetListView.create: {e}")
            print(error_trace)
            # Check if it's a validation error from DRF
            if hasattr(e, 'detail'):
                return Response(
                    {'error': str(e), 'detail': e.detail if isinstance(e.detail, (str, dict)) else 'Validation error'},
                    status=getattr(e, 'status_code', status.HTTP_500_INTERNAL_SERVER_ERROR)
                )
            return Response(
                {
                    'error': str(e),
                    'detail': 'Failed to create lost pet report',
                    'traceback': error_trace if getattr(settings, 'DEBUG', False) else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        # Set status to 'Pending' for admin approval
        # For lost pets, don't set found_date (it should be None)
        # Ensure user is authenticated
        if not self.request.user or not self.request.user.is_authenticated:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed('User must be authenticated to create a pet report')
        
        # Save with required fields
        try:
            serializer.save(
                posted_by=self.request.user, 
                adoption_status='Pending', 
                is_verified=False
            )
        except Exception as e:
            import traceback
            error_msg = f"Error saving pet in LostPetListView.perform_create: {e}"
            print(error_msg)
            print(traceback.format_exc())
            # Re-raise with more context
            raise Exception(f"{error_msg}. Check database constraints and field values.") from e


class FoundPetListView(generics.ListCreateAPIView):
    """List and create found pets."""
    serializer_class = PetSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        # Automatically move found pets to adoption after 15 days
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=15)
        found_pets_to_move = Pet.objects.filter(
            adoption_status='Found',
            found_date__isnull=False,
            found_date__lte=cutoff_date,
            moved_to_adoption=False,
            is_reunited=False
        )
        
        for pet in found_pets_to_move:
            days = pet.calculate_days_in_care()
            if days >= 15:
                pet.moved_to_adoption = True
                pet.moved_to_adoption_date = timezone.now()
                pet.adoption_status = 'Available for Adoption'
                pet.owner_consent_for_adoption = True
                pet.save()
        
        return Pet.objects.filter(adoption_status='Found').select_related('category', 'owner', 'posted_by').prefetch_related('images')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error handling."""
        try:
            # Handle species -> category mapping if species is provided
            # For FormData (QueryDict), we need to create a mutable copy
            from django.http import QueryDict
            
            # Get the data and make it mutable if it's a QueryDict
            data = request.data
            if isinstance(data, QueryDict):
                data = data.copy()  # This creates a mutable copy
            elif hasattr(data, '_mutable') and not data._mutable:
                data._mutable = True
            
            # Check if species is provided but category_id is not
            species = None
            if hasattr(data, 'get'):
                species_value = data.get('species', '')
                if isinstance(species_value, str):
                    species = species_value.strip()
                elif isinstance(species_value, list) and len(species_value) > 0:
                    species = str(species_value[0]).strip()
            
            # Map species to category_id if needed
            if species and not data.get('category_id'):
                try:
                    # Clean species name - remove "Lost" or "Found" prefix if present
                    species_cleaned = species.strip()
                    # Remove "Lost" or "Found" prefix (case-insensitive)
                    if species_cleaned.lower().startswith('lost '):
                        species_cleaned = species_cleaned[5:].strip()
                    elif species_cleaned.lower().startswith('found '):
                        species_cleaned = species_cleaned[6:].strip()
                    
                    # Normalize species name (capitalize first letter, rest lowercase)
                    species_normalized = species_cleaned.capitalize()
                    
                    # Try to find existing category (case-insensitive)
                    category = None
                    try:
                        category = Category.objects.get(name__iexact=species_normalized)
                    except Category.DoesNotExist:
                        # If not found, try exact match first
                        try:
                            category = Category.objects.get(name=species_normalized)
                        except Category.DoesNotExist:
                            # Create new category with normalized name (clean, no prefix)
                            category = Category.objects.create(
                                name=species_normalized,
                                description=f'Category for {species_normalized}'
                            )
                    
                    # Ensure category_id is an integer (serializer expects int)
                    data['category_id'] = int(category.id)
                    # Remove species from data as it's not a Pet model field
                    if 'species' in data:
                        if isinstance(data, QueryDict):
                            data.pop('species', None)
                        elif hasattr(data, 'pop'):
                            data.pop('species', None)
                        elif 'species' in data:
                            del data['species']
                except Exception as cat_error:
                    import traceback
                    print(f"Error creating/finding category for species '{species}': {cat_error}")
                    print(traceback.format_exc())
                    # Continue without category - it's optional
            
            # Make sure name field is present (required field)
            if not data.get('name'):
                return Response(
                    {
                        'error': 'Validation failed',
                        'detail': 'Name field is required',
                        'errors': {'name': ['This field is required.']}
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert data types for Decimal and Integer fields
            # Weight: DecimalField(max_digits=5, decimal_places=2)
            if data.get('weight'):
                try:
                    weight_val = data.get('weight')
                    if isinstance(weight_val, str):
                        weight_val = weight_val.strip()
                        if weight_val:
                            # Convert to float then to string for DecimalField
                            float_val = float(weight_val)
                            # Ensure it fits in max_digits=5, decimal_places=2
                            if float_val > 999.99:
                                float_val = 999.99
                            data['weight'] = str(float_val)
                    elif isinstance(weight_val, (int, float)):
                        data['weight'] = str(float(weight_val))
                except (ValueError, TypeError) as e:
                    print(f"Warning: Invalid weight value '{data.get('weight')}': {e}")
                    data.pop('weight', None)  # Remove invalid weight
            
            # Age: IntegerField
            if data.get('age'):
                try:
                    age_val = data.get('age')
                    if isinstance(age_val, str):
                        age_val = age_val.strip()
                        if age_val:
                            data['age'] = int(float(age_val))  # Convert to int
                    elif isinstance(age_val, (int, float)):
                        data['age'] = int(age_val)
                except (ValueError, TypeError) as e:
                    print(f"Warning: Invalid age value '{data.get('age')}': {e}")
                    data.pop('age', None)  # Remove invalid age
            
            # Location coordinates: DecimalField(max_digits=9, decimal_places=6)
            for coord_field in ['location_latitude', 'location_longitude']:
                if data.get(coord_field):
                    try:
                        coord_val = data.get(coord_field)
                        if isinstance(coord_val, str):
                            coord_val = coord_val.strip()
                            if coord_val:
                                float_val = float(coord_val)
                                # Validate ranges
                                if coord_field == 'location_latitude' and (-90 <= float_val <= 90):
                                    data[coord_field] = str(float_val)
                                elif coord_field == 'location_longitude' and (-180 <= float_val <= 180):
                                    data[coord_field] = str(float_val)
                                else:
                                    print(f"Warning: {coord_field} out of range: {float_val}")
                                    data.pop(coord_field, None)
                        elif isinstance(coord_val, (int, float)):
                            data[coord_field] = str(float(coord_val))
                    except (ValueError, TypeError) as e:
                        print(f"Warning: Invalid {coord_field} value '{data.get(coord_field)}': {e}")
                        data.pop(coord_field, None)  # Remove invalid coordinate
            
            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                # Return validation errors with details
                return Response(
                    {
                        'error': 'Validation failed',
                        'detail': 'Please check the form data',
                        'errors': serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                self.perform_create(serializer)
                # Get the created instance
                instance = serializer.instance
                # Re-serialize with request context to ensure proper URL generation
                try:
                    response_serializer = self.get_serializer(instance, context={'request': request})
                    response_data = response_serializer.data
                    headers = self.get_success_headers(response_data)
                    return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
                except Exception as serialize_error:
                    import traceback
                    error_trace = traceback.format_exc()
                    print(f"Error serializing created pet response: {serialize_error}")
                    print(error_trace)
                    # Fallback: return basic data without full serialization
                    basic_data = {
                        'id': instance.id if instance else None,
                        'name': instance.name if instance else None,
                        'adoption_status': instance.adoption_status if instance else 'Found',
                        'message': 'Pet created successfully, but some data could not be serialized'
                    }
                    if instance:
                        basic_data['created_at'] = instance.created_at.isoformat() if hasattr(instance, 'created_at') and instance.created_at else None
                    return Response(
                        basic_data,
                        status=status.HTTP_201_CREATED
                    )
            except Exception as save_error:
                import traceback
                error_trace = traceback.format_exc()
                print(f"Error in FoundPetListView.perform_create: {save_error}")
                print(error_trace)
                return Response(
                    {
                        'error': str(save_error),
                        'detail': 'Failed to save pet data',
                        'traceback': error_trace if getattr(settings, 'DEBUG', False) else None
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in FoundPetListView.create: {e}")
            print(error_trace)
            # Check if it's a validation error from DRF
            if hasattr(e, 'detail'):
                return Response(
                    {'error': str(e), 'detail': e.detail if isinstance(e.detail, (str, dict)) else 'Validation error'},
                    status=getattr(e, 'status_code', status.HTTP_500_INTERNAL_SERVER_ERROR)
                )
            return Response(
                {
                    'error': str(e),
                    'detail': 'Failed to create found pet report',
                    'traceback': error_trace if getattr(settings, 'DEBUG', False) else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        # Set status to 'Pending' for admin approval
        # For found pets, set found_date to distinguish from lost pets
        from django.utils import timezone
        try:
            # Ensure user is authenticated
            if not self.request.user or not self.request.user.is_authenticated:
                from rest_framework.exceptions import AuthenticationFailed
                raise AuthenticationFailed('User must be authenticated to create a pet report')
            
            data = serializer.validated_data
            # Get found_date from various possible fields
            found_date = data.get('found_date') or data.get('foundDate')
            # If not provided, try to use last_seen (date when pet was found)
            if not found_date and data.get('last_seen'):
                found_date = data.get('last_seen')
            # If still not provided, set it to now for found pets
            if not found_date:
                found_date = timezone.now()
            
            # IMPORTANT: Always set adoption_status to 'Pending' for found pets
            # This ensures they go through admin approval before becoming 'Found'
            # After 15 days, they will automatically move to 'Available for Adoption'
            serializer.save(
                posted_by=self.request.user, 
                adoption_status='Pending',  # Must be Pending, not Found or Available for Adoption
                is_verified=False,
                found_date=found_date,
                moved_to_adoption=False,  # Ensure this is False initially
                is_reunited=False  # Ensure this is False initially
            )
        except Exception as e:
            import traceback
            print(f"Error in FoundPetListView.perform_create: {e}")
            print(traceback.format_exc())
            raise


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_lost_found(request, lost_pet_id, found_pet_id):
    """Match a lost pet with a found pet."""
    try:
        lost_pet = Pet.objects.get(id=lost_pet_id, adoption_status='Lost')
        found_pet = Pet.objects.get(id=found_pet_id, adoption_status='Found')
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update both pets to reunited status
    lost_pet.adoption_status = 'Reunited'
    lost_pet.save()
    
    found_pet.adoption_status = 'Reunited'
    found_pet.save()
    
    # Create notification for both users
    from notifications.models import Notification
    
    if lost_pet.posted_by:
        Notification.objects.create(
            user=lost_pet.posted_by,
            title='Pet Matched!',
            message=f'Your lost pet "{lost_pet.name}" has been matched with a found pet!',
            notification_type='lost_pet_matched',
            link_target=f'/pets/{found_pet.id}',
            related_pet=found_pet
        )
    
    if found_pet.posted_by:
        Notification.objects.create(
            user=found_pet.posted_by,
            title='Pet Matched!',
            message=f'Your found pet has been matched with a lost pet "{lost_pet.name}"!',
            notification_type='lost_pet_matched',
            link_target=f'/pets/{lost_pet.id}',
            related_pet=lost_pet
        )
    
    return Response({
        'message': 'Pets matched successfully',
        'lost_pet': PetSerializer(lost_pet).data,
        'found_pet': PetSerializer(found_pet).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_pet(request, pet_id):
    """Admin endpoint to verify a pet."""
    if not request.user.is_staff:
        return Response(
            {'message': 'Only admins can verify pets'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        pet = Pet.objects.get(id=pet_id)
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    pet.is_verified = True
    pet.save()
    
    # Log admin action
    from adminpanel.models import AdminLog
    AdminLog.objects.create(
        admin=request.user,
        action='VERIFY',
        model_type='Pet',
        object_id=pet.id,
        description=f'Verified pet: {pet.name}',
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    # Create notification
    if pet.posted_by:
        from notifications.models import Notification
        Notification.objects.create(
            user=pet.posted_by,
            title='Pet Verified',
            message=f'Your pet "{pet.name}" has been verified!',
            notification_type='pet_verified',
            link_target=f'/pets/{pet.id}',
            related_pet=pet
        )
    
    return Response(PetSerializer(pet).data)


class PetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a pet."""
    queryset = Pet.objects.select_related('category', 'owner', 'posted_by').prefetch_related('images')
    serializer_class = PetSerializer
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if this is a found pet that should be moved to adoption after 15 days
        if (instance.adoption_status == 'Found' and 
            instance.found_date and 
            not instance.moved_to_adoption and 
            not instance.is_reunited):
            from django.utils import timezone
            days = instance.calculate_days_in_care()
            if days >= 15:
                instance.moved_to_adoption = True
                instance.moved_to_adoption_date = timezone.now()
                instance.adoption_status = 'Available for Adoption'
                instance.owner_consent_for_adoption = True
                instance.save()
                
                # Notify the person who found the pet
                if instance.posted_by:
                    from notifications.models import Notification
                    Notification.objects.create(
                        user=instance.posted_by,
                        title='Pet Moved to Adoption',
                        message=f'"{instance.name}" has been automatically moved to adoption listing after 15 days in care.',
                        notification_type='system',
                        related_pet=instance
                    )
        
        # Increment view count
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance, context={'request': request})
        return Response(serializer.data)

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_update(self, serializer):
        instance = self.get_object()
        # Only owner or admin can update
        if instance.posted_by != self.request.user and not self.request.user.is_staff:
            raise PermissionError("You don't have permission to update this pet.")
        serializer.save()

    def perform_destroy(self, instance):
        # Only owner or admin can delete
        if instance.posted_by != self.request.user and not self.request.user.is_staff:
            raise PermissionError("You don't have permission to delete this pet.")
        instance.delete()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_for_adoption(request, pet_id):
    """Apply for pet adoption."""
    try:
        pet = Pet.objects.get(id=pet_id)
    except Pet.DoesNotExist:
        return Response(
            {'message': 'Pet not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if already applied
    existing = AdoptionApplication.objects.filter(pet=pet, applicant=request.user).first()
    if existing:
        return Response(
            {'message': 'You have already applied for this pet'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = AdoptionApplicationSerializer(
        data={
            'pet_id': pet_id,
            'message': request.data.get('message', '')
        },
        context={'request': request}
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdoptionApplicationListView(generics.ListAPIView):
    """List adoption applications."""
    serializer_class = AdoptionApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Users see their own applications, admins see all
        if user.is_staff:
            return AdoptionApplication.objects.select_related('pet', 'applicant').all()
        return AdoptionApplication.objects.filter(applicant=user).select_related('pet', 'applicant')


class AdoptionApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an adoption application."""
    serializer_class = AdoptionApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return AdoptionApplication.objects.select_related('pet', 'applicant').all()
        return AdoptionApplication.objects.filter(applicant=user).select_related('pet', 'applicant')


# Medical Records Views (Admin Only)
class MedicalRecordListView(generics.ListCreateAPIView):
    """List and create medical records (Admin only)."""
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        pet_id = self.request.query_params.get('pet_id')
        queryset = MedicalRecord.objects.select_related('pet', 'registered_by').all()
        if pet_id:
            queryset = queryset.filter(pet_id=pet_id)
        return queryset.order_by('-created_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class MedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a medical record (Admin only)."""
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAdminUser]
    queryset = MedicalRecord.objects.select_related('pet', 'registered_by').all()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_pet_medical_records(request, pet_id):
    """Get all medical records for a specific pet (Admin only)."""
    try:
        records = MedicalRecord.objects.filter(pet_id=pet_id).select_related('registered_by').order_by('-created_at')
        serializer = MedicalRecordSerializer(records, many=True, context={'request': request})
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        print(f"Error in get_pet_medical_records: {e}")
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

