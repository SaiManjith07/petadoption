from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from pets.models import Pet
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Automatically move found pets to adoption after 15 days'

    def handle(self, *args, **options):
        # Get all found pets that have been in care for 15+ days and haven't been moved to adoption
        cutoff_date = timezone.now() - timedelta(days=15)
        
        found_pets = Pet.objects.filter(
            adoption_status='Found',
            found_date__isnull=False,
            found_date__lte=cutoff_date,
            moved_to_adoption=False,
            is_reunited=False
        )
        
        moved_count = 0
        
        for pet in found_pets:
            # Calculate days in care
            days = pet.calculate_days_in_care()
            
            if days >= 15:
                # Don't automatically move - send notification to uploader asking for consent
                # Only move when uploader explicitly gives consent via check_15_day_adoption endpoint
                
                # Check if notification already sent
                existing_notification = Notification.objects.filter(
                    user=pet.posted_by,
                    related_pet=pet,
                    notification_type='consent_required',
                    is_read=False
                ).first()
                
                if not existing_notification and pet.posted_by:
                    Notification.objects.create(
                        user=pet.posted_by,
                        title='Action Required: Pet Adoption Decision',
                        message=f'"{pet.name}" has been in care for {days} days. Please visit the pet page to decide: Keep the pet or move to adoption listing.',
                        notification_type='consent_required',
                        link_target=f'/pets/{pet.id}',
                        related_pet=pet
                    )
                    
                    self.stdout.write(
                        self.style.WARNING(
                            f'Notification sent to uploader for pet {pet.id} ({pet.name}) - {days} days in care. Waiting for consent.'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Pet {pet.id} ({pet.name}) - {days} days in care. Notification already sent or no uploader.'
                        )
                    )
        
        if moved_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSuccessfully moved {moved_count} pet(s) to adoption.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('\nNo pets needed to be moved to adoption.')
            )

