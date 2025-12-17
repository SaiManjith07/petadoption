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
                # Automatically move to adoption
                pet.moved_to_adoption = True
                pet.moved_to_adoption_date = timezone.now()
                pet.adoption_status = 'Available for Adoption'
                pet.owner_consent_for_adoption = True  # Auto-consent after 15 days
                pet.save()
                
                moved_count += 1
                
                # Notify the person who found the pet
                if pet.posted_by:
                    Notification.objects.create(
                        user=pet.posted_by,
                        title='Pet Moved to Adoption',
                        message=f'"{pet.name}" has been automatically moved to adoption listing after 15 days in care.',
                        notification_type='system',
                        related_pet=pet
                    )
                
                # Notify shelter if pet is in a shelter
                if pet.current_location_type == 'shelter':
                    try:
                        from users.models import Shelter
                        shelter = Shelter.objects.get(id=pet.current_location_id)
                        Notification.objects.create(
                            user=shelter.user,
                            title='Pet Moved to Adoption',
                            message=f'"{pet.name}" has been automatically moved to adoption listing after 15 days.',
                            notification_type='system',
                            related_pet=pet
                        )
                    except:
                        pass
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Moved pet {pet.id} ({pet.name}) to adoption after {days} days'
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

