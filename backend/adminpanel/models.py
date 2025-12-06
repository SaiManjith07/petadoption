from django.db import models
from django.conf import settings
from django.utils import timezone


class AdminLog(models.Model):
    """Log model for tracking admin actions."""
    
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('VERIFY', 'Verify'),
        ('FEATURE', 'Feature'),
        ('UNFEATURE', 'Unfeature'),
    ]

    MODEL_CHOICES = [
        ('User', 'User'),
        ('Pet', 'Pet'),
        ('AdoptionApplication', 'AdoptionApplication'),
        ('Category', 'Category'),
        ('ChatRoom', 'ChatRoom'),
        ('Message', 'Message'),
    ]

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_type = models.CharField(max_length=50, choices=MODEL_CHOICES)
    object_id = models.IntegerField()
    description = models.TextField()
    changes = models.JSONField(default=dict, blank=True)  # Store field changes
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', 'created_at']),
            models.Index(fields=['model_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.admin} - {self.action} - {self.model_type} #{self.object_id}"


class SystemSettings(models.Model):
    """System-wide settings model."""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_settings'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'System Settings'

    def __str__(self):
        return self.key


class DashboardStats(models.Model):
    """Cached dashboard statistics for admin panel."""
    
    # Pet statistics
    total_pets = models.IntegerField(default=0)
    pending_pets = models.IntegerField(default=0)
    found_pets = models.IntegerField(default=0)
    lost_pets = models.IntegerField(default=0)
    available_pets = models.IntegerField(default=0)
    adopted_pets = models.IntegerField(default=0)
    
    # User statistics
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    
    # Application statistics
    total_applications = models.IntegerField(default=0)
    pending_applications = models.IntegerField(default=0)
    
    # Chat statistics
    total_chats = models.IntegerField(default=0)
    active_chats = models.IntegerField(default=0)
    pending_chat_requests = models.IntegerField(default=0)
    
    # Recent activity (last 7 days)
    pets_last_7_days = models.IntegerField(default=0)
    users_last_7_days = models.IntegerField(default=0)
    
    # Metadata
    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_dashboard_stats'
    )
    
    class Meta:
        verbose_name_plural = 'Dashboard Statistics'
        get_latest_by = 'last_updated'
    
    def __str__(self):
        return f"Dashboard Stats - Updated: {self.last_updated}"
    
    @classmethod
    def get_latest(cls):
        """Get the latest dashboard stats or create if none exists."""
        stats = cls.objects.first()
        if not stats:
            stats = cls.objects.create()
            stats.update_stats()
        return stats
    
    def update_stats(self):
        """Update all statistics from database."""
        from pets.models import Pet, AdoptionApplication
        from users.models import User
        from datetime import timedelta
        from django.db import connection
        
        # Pet statistics
        try:
            self.total_pets = Pet.objects.count()
            self.pending_pets = Pet.objects.filter(adoption_status='Pending').count()
            self.found_pets = Pet.objects.filter(adoption_status='Found').count()
            self.lost_pets = Pet.objects.filter(adoption_status='Lost').count()
            self.available_pets = Pet.objects.filter(adoption_status='Available for Adoption').count()
            self.adopted_pets = Pet.objects.filter(adoption_status='Adopted').count()
        except Exception:
            self.total_pets = 0
            self.pending_pets = 0
            self.found_pets = 0
            self.lost_pets = 0
            self.available_pets = 0
            self.adopted_pets = 0
        
        # User statistics
        try:
            self.total_users = User.objects.count()
            self.active_users = User.objects.filter(is_active=True).count()
        except Exception:
            self.total_users = 0
            self.active_users = 0
        
        # Application statistics
        try:
            self.total_applications = AdoptionApplication.objects.count()
            self.pending_applications = AdoptionApplication.objects.filter(status='Pending').count()
        except Exception:
            self.total_applications = 0
            self.pending_applications = 0
        
        # Chat statistics - check if table exists first
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'chats_chatroom'
                    );
                """)
                chat_table_exists = cursor.fetchone()[0]
            
            if chat_table_exists:
                from chats.models import ChatRoom
                self.total_chats = ChatRoom.objects.count()
                self.active_chats = ChatRoom.objects.filter(is_active=True).count()
            else:
                self.total_chats = 0
                self.active_chats = 0
        except Exception:
            self.total_chats = 0
            self.active_chats = 0
        
        self.pending_chat_requests = 0  # Placeholder for future ChatRequest model
        
        # Recent activity
        try:
            week_ago = timezone.now() - timedelta(days=7)
            self.pets_last_7_days = Pet.objects.filter(created_at__gte=week_ago).count()
            self.users_last_7_days = User.objects.filter(date_joined__gte=week_ago).count()
        except Exception:
            self.pets_last_7_days = 0
            self.users_last_7_days = 0
        
        self.save()
    
    def to_dict(self):
        """Convert stats to dictionary format."""
        return {
            'pets': {
                'total': self.total_pets,
                'pending': self.pending_pets,
                'found': self.found_pets,
                'lost': self.lost_pets,
                'available': self.available_pets,
                'adopted': self.adopted_pets,
            },
            'users': {
                'total': self.total_users,
                'active': self.active_users,
            },
            'applications': {
                'total': self.total_applications,
                'pending': self.pending_applications,
            },
            'chats': {
                'total': self.total_chats,
                'active': self.active_chats,
                'pending_requests': self.pending_chat_requests,
            },
            'recent_activity': {
                'pets_last_7_days': self.pets_last_7_days,
                'users_last_7_days': self.users_last_7_days,
            }
        }
