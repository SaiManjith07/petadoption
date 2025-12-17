from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from pets.models import Pet


class Command(BaseCommand):
    help = 'Fix all pets with invalid owner/posted_by foreign key references'

    def handle(self, *args, **options):
        User = get_user_model()
        fixed_count = 0
        
        self.stdout.write(self.style.WARNING('Checking all pets for invalid foreign key references...'))
        
        for pet in Pet.objects.all():
            fixed = False
            
            # Check posted_by_id
            if pet.posted_by_id:
                try:
                    User.objects.get(id=pet.posted_by_id)
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  Pet {pet.id} ({pet.name}): posted_by_id {pet.posted_by_id} is invalid - clearing'
                        )
                    )
                    pet.posted_by_id = None
                    pet.save(update_fields=['posted_by_id'])
                    fixed = True
            
            # Check owner_id
            if pet.owner_id:
                try:
                    User.objects.get(id=pet.owner_id)
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  Pet {pet.id} ({pet.name}): owner_id {pet.owner_id} is invalid - clearing'
                        )
                    )
                    pet.owner_id = None
                    pet.save(update_fields=['owner_id'])
                    fixed = True
            
            if fixed:
                fixed_count += 1
        
        if fixed_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'\nFixed {fixed_count} pet(s) with invalid foreign key references.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('\nAll pets have valid foreign key references.')
            )

