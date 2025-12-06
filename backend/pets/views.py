from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.db.models import Q
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
        return Pet.objects.filter(adoption_status='Lost').select_related('category', 'owner', 'posted_by').prefetch_related('images')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error handling."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in LostPetListView.create: {e}")
            print(error_trace)
            return Response(
                {'error': str(e), 'detail': 'Failed to create lost pet report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        # Set status to 'Pending' for admin approval
        # For lost pets, don't set found_date (it should be None)
        try:
            serializer.save(posted_by=self.request.user, adoption_status='Pending', is_verified=False)
        except Exception as e:
            import traceback
            print(f"Error in LostPetListView.perform_create: {e}")
            print(traceback.format_exc())
            raise


class FoundPetListView(generics.ListCreateAPIView):
    """List and create found pets."""
    serializer_class = PetSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        return Pet.objects.filter(adoption_status='Found').select_related('category', 'owner', 'posted_by').prefetch_related('images')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error handling."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in FoundPetListView.create: {e}")
            print(error_trace)
            return Response(
                {'error': str(e), 'detail': 'Failed to create found pet report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        # Set status to 'Pending' for admin approval
        # For found pets, set found_date to distinguish from lost pets
        from django.utils import timezone
        try:
            data = serializer.validated_data
            found_date = data.get('found_date') or data.get('foundDate')
            if not found_date:
                # If no found_date provided, set it to now for found pets
                found_date = timezone.now()
            serializer.save(
                posted_by=self.request.user, 
                adoption_status='Pending', 
                is_verified=False,
                found_date=found_date
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

