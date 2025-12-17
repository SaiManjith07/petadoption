"""
Quick script to fix a specific pet's owner.
Usage: python manage.py fix_pet_owner --pet-id 6 --user-id 1
"""
from django.core.management.base import BaseCommand
from pets.models import Pet
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix a specific pet\'s owner reference'

    def add_arguments(self, parser):
        parser.add_argument('--pet-id', type=int, required=True, help='Pet ID to fix')
        parser.add_argument('--user-id', type=int, help='User ID to assign as owner (optional)')

    def handle(self, *args, **options):
        pet_id = options['pet_id']
        user_id = options.get('user_id')
        
        try:
            pet = Pet.objects.get(id=pet_id)
            self.stdout.write(f'Pet ID {pet_id}: {pet.name}')
            self.stdout.write(f'Current posted_by: {pet.posted_by_id} ({pet.posted_by.email if pet.posted_by else "None"})')
            self.stdout.write(f'Current owner: {pet.owner_id} ({pet.owner.email if pet.owner else "None"})')
            
            # Check if current references are valid
            if pet.posted_by_id:
                try:
                    User.objects.get(id=pet.posted_by_id)
                    self.stdout.write(self.style.SUCCESS(f'✓ posted_by_id {pet.posted_by_id} is valid'))
                except User.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'✗ posted_by_id {pet.posted_by_id} is INVALID (user does not exist)'))
                    if user_id:
                        try:
                            new_user = User.objects.get(id=user_id)
                            pet.posted_by = new_user
                            pet.save(update_fields=['posted_by'])
                            self.stdout.write(self.style.SUCCESS(f'✓ Fixed: Set posted_by to user {user_id}'))
                        except User.DoesNotExist:
                            self.stdout.write(self.style.ERROR(f'✗ User {user_id} does not exist'))
                    else:
                        pet.posted_by = None
                        pet.save(update_fields=['posted_by'])
                        self.stdout.write(self.style.WARNING(f'⚠ Cleared invalid posted_by reference'))
            
            if pet.owner_id:
                try:
                    User.objects.get(id=pet.owner_id)
                    self.stdout.write(self.style.SUCCESS(f'✓ owner_id {pet.owner_id} is valid'))
                except User.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'✗ owner_id {pet.owner_id} is INVALID (user does not exist)'))
                    if user_id:
                        try:
                            new_user = User.objects.get(id=user_id)
                            pet.owner = new_user
                            pet.save(update_fields=['owner'])
                            self.stdout.write(self.style.SUCCESS(f'✓ Fixed: Set owner to user {user_id}'))
                        except User.DoesNotExist:
                            self.stdout.write(self.style.ERROR(f'✗ User {user_id} does not exist'))
                    else:
                        pet.owner = None
                        pet.save(update_fields=['owner'])
                        self.stdout.write(self.style.WARNING(f'⚠ Cleared invalid owner reference'))
            
            # If no owner and user_id provided, set it
            if user_id and not pet.posted_by and not pet.owner:
                try:
                    new_user = User.objects.get(id=user_id)
                    pet.posted_by = new_user
                    pet.save(update_fields=['posted_by'])
                    self.stdout.write(self.style.SUCCESS(f'✓ Set posted_by to user {user_id}'))
                except User.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'✗ User {user_id} does not exist'))
            
            # Show final state
            pet.refresh_from_db()
            self.stdout.write(f'\nFinal state:')
            self.stdout.write(f'  posted_by: {pet.posted_by_id} ({pet.posted_by.email if pet.posted_by else "None"})')
            self.stdout.write(f'  owner: {pet.owner_id} ({pet.owner.email if pet.owner else "None"})')
            
        except Pet.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Pet ID {pet_id} does not exist'))

