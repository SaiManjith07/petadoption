"""
Management command to fix pets with invalid owner references.
Run: python manage.py fix_invalid_pet_owners
"""
from django.core.management.base import BaseCommand
from pets.models import Pet
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix pets that have invalid owner/posted_by references'

    def handle(self, *args, **options):
        self.stdout.write('Checking for pets with invalid owner references...')
        
        fixed_count = 0
        invalid_pets = []
        
        # Check all pets
        for pet in Pet.objects.all():
            issues = []
            
            # Check posted_by
            if pet.posted_by_id:
                try:
                    User.objects.get(id=pet.posted_by_id)
                except User.DoesNotExist:
                    issues.append(f'posted_by_id={pet.posted_by_id} (user does not exist)')
                    pet.posted_by = None
                    pet.save(update_fields=['posted_by'])
                    fixed_count += 1
            
            # Check owner
            if pet.owner_id:
                try:
                    User.objects.get(id=pet.owner_id)
                except User.DoesNotExist:
                    issues.append(f'owner_id={pet.owner_id} (user does not exist)')
                    pet.owner = None
                    pet.save(update_fields=['owner'])
                    fixed_count += 1
            
            if issues:
                invalid_pets.append({
                    'pet_id': pet.id,
                    'pet_name': pet.name,
                    'issues': issues
                })
        
        if invalid_pets:
            self.stdout.write(self.style.WARNING(f'\nFound {len(invalid_pets)} pets with invalid references:'))
            for pet_info in invalid_pets:
                self.stdout.write(f"  Pet ID {pet_info['pet_id']} ({pet_info['pet_name']}): {', '.join(pet_info['issues'])}")
        
        if fixed_count > 0:
            self.stdout.write(self.style.SUCCESS(f'\n✓ Fixed {fixed_count} invalid references'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✓ No invalid references found'))
