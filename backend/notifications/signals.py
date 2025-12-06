"""
Django signals for automatic notification creation.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from pets.models import Pet, AdoptionApplication
from chats.models import Message
from .models import Notification

User = get_user_model()


@receiver(post_save, sender=Pet)
def notify_pet_approved(sender, instance, created, **kwargs):
    """Notify user when pet is verified/approved."""
    # Only notify if pet was just verified (not on creation, and is_verified changed to True)
    if not created and instance.is_verified and instance.posted_by:
        # Check if any approval notification already exists (either pet_approved or pet_verified)
        # This prevents duplicate notifications when admin approves via the view
        existing = Notification.objects.filter(
            user=instance.posted_by,
            notification_type__in=['pet_verified', 'pet_approved'],
            related_pet=instance,
            is_read=False
        ).first()
        
        # If update_fields contains 'is_verified', it's likely an admin approval
        # In that case, the view will create the notification, so we skip here
        update_fields = kwargs.get('update_fields')
        if update_fields and 'is_verified' in update_fields:
            # Admin approval - don't create here, let the view handle it
            return
        
        # Only create notification if one doesn't already exist
        if not existing:
            Notification.objects.create(
                user=instance.posted_by,  # Only send to the user who posted, never to admin
                title='Pet Verified',
                message=f'Your pet "{instance.name}" has been verified and is now live!',
                notification_type='pet_verified',
                link_target=f'/pets/{instance.id}',
                related_pet=instance
            )


@receiver(post_save, sender=AdoptionApplication)
def notify_adoption_status(sender, instance, created, **kwargs):
    """Notify user when adoption application status changes."""
    if not created and instance.applicant:
        if instance.status == 'Approved':
            Notification.objects.create(
                user=instance.applicant,
                title='Adoption Approved',
                message=f'Your adoption application for "{instance.pet.name}" has been approved!',
                notification_type='adoption_approved',
                link_target=f'/pets/{instance.pet.id}',
                related_pet=instance.pet
            )
        elif instance.status == 'Rejected':
            Notification.objects.create(
                user=instance.applicant,
                title='Adoption Rejected',
                message=f'Your adoption application for "{instance.pet.name}" was not approved.',
                notification_type='adoption_rejected',
                link_target=f'/pets/{instance.pet.id}',
                related_pet=instance.pet
            )


@receiver(post_save, sender=Message)
def notify_new_message(sender, instance, created, **kwargs):
    """Notify users when they receive a new message."""
    if created:
        # Notify all participants in the room except the sender
        room = instance.room
        for participant in room.participants.exclude(id=instance.sender.id):
            Notification.objects.create(
                user=participant,
                title='New Message',
                message=f'You have a new message from {instance.sender.name}',
                notification_type='new_message',
                link_target=f'/chats/{room.id}',
                related_user=instance.sender
            )


@receiver(post_save, sender=Pet)
def notify_pet_adopted(sender, instance, created, **kwargs):
    """Notify when pet is adopted."""
    if not created and instance.adoption_status == 'Adopted' and instance.posted_by:
        Notification.objects.create(
            user=instance.posted_by,
            title='Pet Adopted',
            message=f'Great news! "{instance.name}" has been adopted!',
            notification_type='pet_adopted',
            link_target=f'/pets/{instance.id}',
            related_pet=instance
        )

