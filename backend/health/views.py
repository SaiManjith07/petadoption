from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import VaccinationCamp, CampRegistration, HealthResource
from .serializers import (
    VaccinationCampSerializer,
    CampRegistrationSerializer,
    HealthResourceSerializer
)


# ==================== VACCINATION CAMPS ====================

class VaccinationCampListView(generics.ListCreateAPIView):
    """List all active vaccination camps or create new (admin only)"""
    serializer_class = VaccinationCampSerializer
    permission_classes = [AllowAny]  # Anyone can view camps

    def get_queryset(self):
        queryset = VaccinationCamp.objects.filter(is_active=True)
        
        # Filter by upcoming camps only (default)
        upcoming_only = self.request.query_params.get('upcoming', 'true').lower() == 'true'
        if upcoming_only:
            today = timezone.now().date()
            queryset = queryset.filter(date__gte=today)
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filter by state
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state__icontains=state)
        
        # Filter by pincode
        pincode = self.request.query_params.get('pincode')
        if pincode:
            queryset = queryset.filter(pincode=pincode)
        
        return queryset.order_by('date', 'start_time')

    def get_permissions(self):
        """Admin only for POST, anyone for GET"""
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class VaccinationCampDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a vaccination camp (admin only for write)"""
    queryset = VaccinationCamp.objects.all()
    serializer_class = VaccinationCampSerializer

    def get_permissions(self):
        """Admin only for write operations"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [AllowAny()]


# ==================== CAMP REGISTRATIONS ====================

class CampRegistrationListView(generics.ListCreateAPIView):
    """List user's camp registrations or create new registration"""
    serializer_class = CampRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own registrations"""
        return CampRegistration.objects.filter(user=self.request.user).order_by('-registered_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CampRegistrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a camp registration"""
    serializer_class = CampRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only access their own registrations"""
        return CampRegistration.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_camp_registrations(request, camp_id):
    """Get all registrations for a specific camp (admin only)"""
    try:
        camp = VaccinationCamp.objects.get(id=camp_id)
        registrations = CampRegistration.objects.filter(camp=camp)
        serializer = CampRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)
    except VaccinationCamp.DoesNotExist:
        return Response(
            {'error': 'Camp not found'},
            status=status.HTTP_404_NOT_FOUND
        )


# ==================== HEALTH RESOURCES ====================

class HealthResourceListView(generics.ListCreateAPIView):
    """List all health resources or create new (admin only)"""
    serializer_class = HealthResourceSerializer
    permission_classes = [AllowAny]  # Anyone can view resources

    def get_queryset(self):
        queryset = HealthResource.objects.all()
        
        # Filter by resource type
        resource_type = self.request.query_params.get('type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        # Filter featured only
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        
        return queryset

    def get_permissions(self):
        """Admin only for POST, anyone for GET"""
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class HealthResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a health resource (admin only for write)"""
    queryset = HealthResource.objects.all()
    serializer_class = HealthResourceSerializer

    def get_permissions(self):
        """Admin only for write operations"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [AllowAny()]

