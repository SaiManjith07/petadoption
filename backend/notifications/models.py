from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """Notification model for user notifications."""
    
    NOTIFICATION_TYPES = [
        ('lost_pet_matched', 'Lost Pet Matched'),
        ('pet_approved', 'Pet Approved'),
        ('pet_adopted', 'Pet Adopted'),
        ('new_message', 'New Chat Message'),
        ('admin_announcement', 'Admin Announcement'),
        ('adoption_approved', 'Adoption Approved'),
        ('adoption_rejected', 'Adoption Rejected'),
        ('pet_verified', 'Pet Verified'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    link_target = models.CharField(max_length=255, blank=True, null=True)  # URL or route
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional: Reference to related object
    related_pet = models.ForeignKey(
        'pets.Pet',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    related_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='received_notifications'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.save(update_fields=['is_read'])
