from django.db import models
from django.conf import settings
from django.utils import timezone


class Category(models.Model):
    """Pet category model."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Pet(models.Model):
    """Pet model for adoption listings."""
    
    STATUS_CHOICES = [
        ('Available for Adoption', 'Available for Adoption'),
        ('Adopted', 'Adopted'),
        ('Pending', 'Pending'),
        ('Lost', 'Lost'),
        ('Found', 'Found'),
        ('Reunited', 'Reunited'),
    ]

    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Unknown', 'Unknown'),
    ]

    SIZE_CHOICES = [
        ('Small', 'Small'),
        ('Medium', 'Medium'),
        ('Large', 'Large'),
        ('Extra Large', 'Extra Large'),
    ]

    name = models.CharField(max_length=255)
    breed = models.CharField(max_length=255, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True, null=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Weight in kg")
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='pets')
    adoption_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Available for Adoption')
    
    # Identification fields
    tag_registration_number = models.CharField(max_length=100, blank=True, null=True, help_text="Tag ID, Registration Number, or License Number")
    
    # Location fields for lost/found pets
    location = models.CharField(max_length=255, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    last_seen = models.DateTimeField(blank=True, null=True)
    location_map_url = models.URLField(blank=True, null=True, help_text="Google Maps or other map service URL")
    location_latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Latitude coordinate")
    location_longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Longitude coordinate")
    
    # Images
    image = models.ImageField(upload_to='pets/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)  # For external images
    cloudinary_url = models.URLField(blank=True, null=True, help_text="Cloudinary URL for the main image")
    cloudinary_public_id = models.CharField(max_length=255, blank=True, null=True, help_text="Cloudinary public_id for the main image")
    
    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_pets',
        null=True,
        blank=True
    )
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='posted_pets',
        null=True,
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional metadata
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    
    # New fields for workflow
    current_location_type = models.CharField(
        max_length=20,
        choices=[('user', 'With User'), ('shelter', 'In Shelter'), ('volunteer', 'With Volunteer')],
        blank=True,
        null=True
    )
    current_location_id = models.IntegerField(blank=True, null=True, help_text="ID of shelter or user holding the pet")
    found_date = models.DateTimeField(blank=True, null=True, help_text="When the pet was found")
    days_in_care = models.IntegerField(default=0, help_text="Days since found")
    owner_consent_for_adoption = models.BooleanField(default=False, help_text="Original finder's consent for adoption")
    moved_to_adoption = models.BooleanField(default=False)
    moved_to_adoption_date = models.DateTimeField(blank=True, null=True)
    
    # Reunification
    is_reunited = models.BooleanField(default=False)
    reunited_with_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reunited_pets'
    )
    reunited_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['adoption_status']),
            models.Index(fields=['category']),
            models.Index(fields=['created_at']),
            models.Index(fields=['found_date', 'adoption_status']),
            models.Index(fields=['current_location_type', 'current_location_id']),
        ]

    def __str__(self):
        return f"{self.name} - {self.adoption_status}"
    
    def calculate_days_in_care(self):
        """Calculate days since found."""
        if self.found_date:
            delta = timezone.now() - self.found_date
            self.days_in_care = delta.days
            return self.days_in_care
        return 0


class PetImage(models.Model):
    """Additional images for pets."""
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='pets/gallery/')
    cloudinary_url = models.URLField(blank=True, null=True, help_text="Cloudinary URL for this image")
    cloudinary_public_id = models.CharField(max_length=255, blank=True, null=True, help_text="Cloudinary public_id for this image")
    caption = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Image for {self.pet.name}"


class MedicalRecord(models.Model):
    """Medical record for pets."""
    
    VACCINATION_STATUS_CHOICES = [
        ('Up to Date', 'Up to Date'),
        ('Partially Vaccinated', 'Partially Vaccinated'),
        ('Not Vaccinated', 'Not Vaccinated'),
        ('Unknown', 'Unknown'),
    ]
    
    HEALTH_STATUS_CHOICES = [
        ('Healthy', 'Healthy'),
        ('Under Treatment', 'Under Treatment'),
        ('Recovering', 'Recovering'),
        ('Chronic Condition', 'Chronic Condition'),
        ('Critical', 'Critical'),
    ]
    
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='medical_records')
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registered_medical_records'
    )
    
    # Basic Health Information
    health_status = models.CharField(
        max_length=50,
        choices=HEALTH_STATUS_CHOICES,
        default='Healthy',
        help_text="Current health status of the pet"
    )
    weight = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Weight in kg")
    temperature = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True, help_text="Body temperature in Celsius")
    
    # Vaccination Information
    vaccination_status = models.CharField(
        max_length=50,
        choices=VACCINATION_STATUS_CHOICES,
        default='Unknown',
        help_text="Vaccination status"
    )
    last_vaccination_date = models.DateField(blank=True, null=True)
    next_vaccination_due = models.DateField(blank=True, null=True)
    vaccination_notes = models.TextField(blank=True, null=True)
    
    # Medical History
    medical_history = models.TextField(blank=True, null=True, help_text="Previous medical conditions and treatments")
    current_medications = models.TextField(blank=True, null=True, help_text="Current medications and dosages")
    allergies = models.TextField(blank=True, null=True, help_text="Known allergies")
    chronic_conditions = models.TextField(blank=True, null=True, help_text="Chronic health conditions")
    
    # Veterinary Information
    veterinarian_name = models.CharField(max_length=255, blank=True, null=True)
    veterinarian_contact = models.CharField(max_length=255, blank=True, null=True)
    clinic_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Spay/Neuter Information
    is_spayed_neutered = models.BooleanField(default=False)
    spay_neuter_date = models.DateField(blank=True, null=True)
    
    # Additional Notes
    notes = models.TextField(blank=True, null=True, help_text="Additional medical notes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_checkup_date = models.DateField(blank=True, null=True)
    next_checkup_due = models.DateField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Medical Record'
        verbose_name_plural = 'Medical Records'
        indexes = [
            models.Index(fields=['pet', '-created_at']),
            models.Index(fields=['health_status']),
            models.Index(fields=['vaccination_status']),
        ]
    
    def __str__(self):
        return f"Medical Record for {self.pet.name} - {self.health_status}"


class AdoptionApplication(models.Model):
    """Adoption application model."""
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Withdrawn', 'Withdrawn'),
    ]

    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications'
    )

    class Meta:
        ordering = ['-applied_at']
        unique_together = ['pet', 'applicant']

    def __str__(self):
        return f"{self.applicant.name} - {self.pet.name}"
