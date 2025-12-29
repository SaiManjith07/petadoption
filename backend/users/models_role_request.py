from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class RoleRequest(models.Model):
    """Model for user role requests (volunteer, rescuer, feeder, transporter)"""
    
    ROLE_CHOICES = [
        ('rescuer', 'Rescuer'),
        ('feeder', 'Feeder'),
        ('transporter', 'Transporter'),
        ('volunteer', 'General Volunteer'),
        ('shelter', 'Shelter Provider'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='role_requests')
    requested_role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    reason = models.TextField(blank=True, help_text="Why do you want this role?")
    experience = models.TextField(blank=True, help_text="Your experience with animals")
    availability = models.CharField(max_length=200, blank=True, help_text="When are you available?")
    resources = models.TextField(blank=True, help_text="What resources can you provide?")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_role_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Role Request'
        verbose_name_plural = 'Role Requests'

    def __str__(self):
        return f"{self.user.name} - {self.requested_role} ({self.status})"

