from django.db import models
from django.conf import settings
from django.utils import timezone


class ChatRoom(models.Model):
    """Chat room model for conversations between users."""
    room_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    user_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_a',
        null=True,
        blank=True
    )
    user_b = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_b',
        null=True,
        blank=True
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_rooms',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    chat_request = models.OneToOneField(
        'ChatRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_room'
    )

    class Meta:
        ordering = ['-updated_at']
        # Remove unique_together since fields are nullable
        # We'll handle uniqueness in application logic if needed

    def __str__(self):
        return f"Chat Room: {self.room_id}"
    
    def save(self, *args, **kwargs):
        if not self.room_id:
            if self.user_a and self.user_b:
                user_ids = sorted([self.user_a.id, self.user_b.id])
                self.room_id = f"{user_ids[0]}_{user_ids[1]}"
            elif hasattr(self, 'participants'):
                participants = list(self.participants.all()[:2])
                if len(participants) == 2:
                    user_ids = sorted([p.id for p in participants])
                    self.room_id = f"{user_ids[0]}_{user_ids[1]}"
        super().save(*args, **kwargs)


class Message(models.Model):
    """Message model for chat conversations."""
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    read_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['room', 'created_at']),
        ]

    def __str__(self):
        return f"Message from {self.sender.name} in {self.room}"

    def mark_as_read(self):
        """Mark message as read."""
        self.read_status = True
        self.save(update_fields=['read_status'])


class ChatRequest(models.Model):
    """Model for chat requests between users with approval workflow."""
    STATUS_CHOICES = [
        ('pending', 'Pending Admin Approval'),
        ('admin_approved', 'Admin Approved - Pending User Acceptance'),
        ('active', 'Active Chat'),
        ('rejected', 'Rejected'),
    ]
    
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_requests_made'
    )
    target = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_requests_received'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_approved_at = models.DateTimeField(null=True, blank=True)
    user_accepted_at = models.DateTimeField(null=True, blank=True)
    
    # Optional: Keep pet reference for pet-related chats
    pet = models.ForeignKey(
        'pets.Pet',
        on_delete=models.SET_NULL,
        related_name='chat_requests',
        null=True,
        blank=True
    )
    type = models.CharField(
        max_length=20,
        choices=[('claim', 'Claim'), ('adoption', 'Adoption'), ('general', 'General')],
        default='general'
    )
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['requester', 'target', 'status']]
        indexes = [
            models.Index(fields=['requester', 'status']),
            models.Index(fields=['target', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Chat request from {self.requester.name} to {self.target.name} - {self.status}"
    
    def get_room_id(self):
        """Generate room_id in format: userA_userB (sorted by ID)"""
        user_ids = sorted([self.requester.id, self.target.id])
        return f"{user_ids[0]}_{user_ids[1]}"