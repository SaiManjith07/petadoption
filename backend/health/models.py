from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class VaccinationCamp(models.Model):
    """Model for vaccination camps organized by NGOs"""
    location = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    ngo = models.CharField(max_length=200)
    ngo_contact = models.CharField(max_length=20, blank=True)
    ngo_email = models.EmailField(blank=True)
    description = models.TextField(blank=True)
    registration_link = models.URLField(blank=True)
    max_capacity = models.IntegerField(default=100, help_text="Maximum number of pets that can be vaccinated")
    current_registrations = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_camps')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']
        verbose_name = 'Vaccination Camp'
        verbose_name_plural = 'Vaccination Camps'

    def __str__(self):
        return f"{self.location} - {self.date}"

    @property
    def is_upcoming(self):
        """Check if camp is in the future"""
        today = timezone.now().date()
        return self.date >= today

    @property
    def available_slots(self):
        """Calculate available registration slots"""
        return max(0, self.max_capacity - self.current_registrations)

    @property
    def is_full(self):
        """Check if camp is full"""
        return self.current_registrations >= self.max_capacity


class CampRegistration(models.Model):
    """Model for pet owners registering their pets for vaccination camps"""
    camp = models.ForeignKey(VaccinationCamp, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='camp_registrations')
    pet_name = models.CharField(max_length=100)
    pet_type = models.CharField(max_length=50, help_text="Dog, Cat, etc.")
    pet_age = models.CharField(max_length=20, blank=True)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('confirmed', 'Confirmed'),
            ('cancelled', 'Cancelled'),
            ('completed', 'Completed'),
        ],
        default='pending'
    )
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-registered_at']
        unique_together = ['camp', 'user', 'pet_name']  # Prevent duplicate registrations
        verbose_name = 'Camp Registration'
        verbose_name_plural = 'Camp Registrations'

    def __str__(self):
        return f"{self.user.name} - {self.pet_name} @ {self.camp.location}"


class HealthResource(models.Model):
    """Model for health resources and information"""
    RESOURCE_TYPES = [
        ('vaccination', 'Vaccination Guide'),
        ('first_aid', 'First Aid Basics'),
        ('microchipping', 'Microchipping Info'),
        ('general', 'General Health'),
    ]

    title = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES)
    content = models.TextField()
    short_description = models.TextField(blank=True)
    image = models.ImageField(upload_to='health_resources/', blank=True, null=True)
    external_link = models.URLField(blank=True, help_text="Link to external resource if applicable")
    is_featured = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='health_resources')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', '-created_at']
        verbose_name = 'Health Resource'
        verbose_name_plural = 'Health Resources'

    def __str__(self):
        return self.title

