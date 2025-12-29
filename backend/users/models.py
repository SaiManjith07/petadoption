from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model."""
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('volunteer', 'Volunteer'),
        ('shelter', 'Shelter'),
        ('rescuer', 'Rescuer'),
        ('feeder', 'Feeder'),
        ('transporter', 'Transporter'),
        ('sub_admin', 'Sub Admin'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin'),
    ]
    
    ADMIN_LEVEL_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('sub_admin', 'Sub Admin'),
    ]
    
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    admin_level = models.CharField(max_length=20, choices=ADMIN_LEVEL_CHOICES, blank=True, null=True, help_text="Admin hierarchy level")
    region = models.CharField(max_length=255, blank=True, null=True, help_text="Region assigned to sub-admin")
    phone = models.CharField(max_length=15, blank=True, null=True)
    country_code = models.CharField(max_length=5, default='+91')
    pincode = models.CharField(max_length=10, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    landmark = models.CharField(max_length=255, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    # Volunteer/Shelter specific fields
    is_volunteer = models.BooleanField(default=False)
    is_shelter_provider = models.BooleanField(default=False)
    volunteer_verified = models.BooleanField(default=False)
    shelter_verified = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_volunteer', 'volunteer_verified']),
            models.Index(fields=['is_shelter_provider', 'shelter_verified']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def is_super_admin(self):
        """Check if user is super admin."""
        return self.is_superuser or self.admin_level == 'super_admin'
    
    @property
    def is_admin_user(self):
        """Check if user is any type of admin."""
        return self.is_staff or self.admin_level in ['super_admin', 'admin', 'sub_admin']
    
    @property
    def is_sub_admin(self):
        """Check if user is sub admin."""
        return self.admin_level == 'sub_admin'


class Volunteer(models.Model):
    """Volunteer profile model."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    ngo_name = models.CharField(max_length=255, blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    skills = models.JSONField(default=list, blank=True)
    availability = models.CharField(max_length=100, blank=True, null=True)
    can_provide_shelter = models.BooleanField(default=False)
    shelter_capacity = models.IntegerField(default=0, help_text="Number of pets they can accommodate")
    shelter_area_sqft = models.IntegerField(default=0, help_text="Shelter area in square feet")
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_volunteers')
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'volunteers'
    
    def __str__(self):
        return f"{self.user.name} - Volunteer"


class Shelter(models.Model):
    """Shelter model."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shelters')
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    
    # Capacity and area
    total_capacity = models.IntegerField(help_text="Total number of pets that can be accommodated")
    current_occupancy = models.IntegerField(default=0)
    area_sqft = models.IntegerField(help_text="Total area in square feet")
    
    # Features
    accepts_feeding = models.BooleanField(default=False, help_text="Accepts feeding data from users")
    facilities = models.JSONField(default=list, blank=True, help_text="List of facilities available")
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_shelters')
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, null=True)
    
    # Location for nearby search
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shelters'
        indexes = [
            models.Index(fields=['is_verified', 'city']),
            models.Index(fields=['accepts_feeding']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.city}"
    
    @property
    def available_capacity(self):
        return self.total_capacity - self.current_occupancy


class FeedingPoint(models.Model):
    """Feeding point/center model."""
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    description = models.TextField(blank=True, null=True)
    contact_phone = models.CharField(max_length=15, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    
    # Location
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    # Admin managed
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_feeding_points')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feeding_points'
        indexes = [
            models.Index(fields=['is_active', 'city']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.city}"


class FeedingRecord(models.Model):
    """Record of feeding provided by users."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feeding_records')
    feeding_point = models.ForeignKey(FeedingPoint, on_delete=models.SET_NULL, null=True, blank=True, related_name='feeding_records')
    shelter = models.ForeignKey(Shelter, on_delete=models.SET_NULL, null=True, blank=True, related_name='feeding_records')
    
    # Feeding details
    menu = models.TextField(help_text="What food was provided")
    feeding_date = models.DateField()
    number_of_pets = models.IntegerField(default=1)
    photos = models.JSONField(default=list, blank=True, help_text="List of photo URLs")
    notes = models.TextField(blank=True, null=True)
    
    # Location (if not at feeding point or shelter)
    location_address = models.TextField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'feeding_records'
        indexes = [
            models.Index(fields=['feeding_date', 'user']),
            models.Index(fields=['feeding_point', 'feeding_date']),
        ]
    
    def __str__(self):
        return f"{self.user.name} - {self.feeding_date}"


class AllowedAdminEmail(models.Model):
    """Model for storing allowed admin email addresses."""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True, null=True, help_text="Optional name for reference")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='allowed_admin_emails_created')
    
    class Meta:
        db_table = 'allowed_admin_emails'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"Allowed Admin: {self.email}"


class AdminRegistration(models.Model):
    """Model for admin registration with PIN verification."""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    country_code = models.CharField(max_length=5, default='+91')
    pincode = models.CharField(max_length=10)
    region = models.CharField(max_length=255, help_text="Region for sub-admin")
    organization = models.CharField(max_length=255, blank=True, null=True, help_text="Organization name (optional)")
    verification_pin = models.CharField(max_length=6)
    pin_sent_at = models.DateTimeField(auto_now_add=True)
    pin_expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_registrations'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['verification_pin']),
            models.Index(fields=['is_verified']),
        ]
    
    def __str__(self):
        return f"Admin Registration: {self.email}"
    
    def is_pin_expired(self):
        """Check if PIN has expired (15 minutes validity)."""
        from django.utils import timezone
        return timezone.now() > self.pin_expires_at
