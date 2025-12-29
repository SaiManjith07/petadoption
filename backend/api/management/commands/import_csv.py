import csv
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from users.models import User
from pets.models import Pet, Category

class Command(BaseCommand):
    help = 'Imports data from CSV files'

    def handle(self, *args, **kwargs):
        base_dir = settings.BASE_DIR.parent  # backend/.. -> petadoption
        users_csv = os.path.join(base_dir, 'users.csv')
        pets_csv = os.path.join(base_dir, 'pets_pet.csv')

        self.import_users(users_csv)
        self.import_pets(pets_csv)

    def parse_bool(self, val):
        if not val: return False
        return val.lower() == 'true'

    def parse_date(self, val):
        if not val: return None
        try:
            return datetime.fromisoformat(val.replace('Z', '+00:00'))
        except ValueError:
            return None

    def import_users(self, filepath):
        if not os.path.exists(filepath):
            self.stdout.write(self.style.WARNING(f"File not found: {filepath}"))
            return

        self.stdout.write(f"Importing Users from {filepath}...")
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                try:
                    user_id = row.get('id')
                    email = row.get('email')
                    
                    if not user_id or not email:
                        continue

                    # Update logic using update_or_create to ensure fields are fresh if needed
                    # Note: Using update_or_create on User with password hashing is tricky if password in CSV is literal hash.
                    # Assuming CSV has hashed password 'pbkdf2_sha256$...' so we just store it.
                    
                    defaults = {
                        'email': email,
                        'is_superuser': self.parse_bool(row.get('is_superuser')),
                        'is_staff': self.parse_bool(row.get('is_staff')),
                        'is_active': self.parse_bool(row.get('is_active')),
                        'date_joined': self.parse_date(row.get('date_joined')) or timezone.now(),
                        'last_login': self.parse_date(row.get('last_login')),
                        'role': row.get('role', 'user'),
                        'phone': row.get('phone', ''),
                        'pincode': row.get('pincode', ''),
                        'age': int(row['age']) if row.get('age') and row['age'].isdigit() else None,
                        'gender': row.get('gender', ''),
                        'name': row.get('name', ''),
                        'country_code': row.get('country_code', '+91'),
                        'address': row.get('address', ''),
                        'landmark': row.get('landmark', ''),
                        'is_shelter_provider': self.parse_bool(row.get('is_shelter_provider')),
                        'is_volunteer': self.parse_bool(row.get('is_volunteer')),
                        'shelter_verified': self.parse_bool(row.get('shelter_verified')),
                        'volunteer_verified': self.parse_bool(row.get('volunteer_verified')),
                        'admin_level': row.get('admin_level'),
                        'region': row.get('region'),
                    }
                    if row.get('password'):
                        defaults['password'] = row.get('password')

                    user, created = User.objects.update_or_create(id=user_id, defaults=defaults)
                    count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error importing user row {row.get('id')}: {e}"))
            
            self.stdout.write(self.style.SUCCESS(f"Successfully processed {count} users."))

    def import_pets(self, filepath):
        if not os.path.exists(filepath):
            self.stdout.write(self.style.WARNING(f"File not found: {filepath}"))
            return

        self.stdout.write(f"Importing Pets from {filepath}...")
        
        default_category, _ = Category.objects.get_or_create(name="Uncategorized")

        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                try:
                    pet_id = row.get('id')
                    if not pet_id: continue
                    
                    category_id = row.get('category_id')
                    
                    # Fix: Use 'name' column as category if available (since CSV stores type in name)
                    category_name = row.get('name')
                    if category_name and not category_name.isdigit():
                        # Clean up the name (capitalize)
                        category_name = category_name.strip().capitalize()
                        category, _ = Category.objects.get_or_create(name=category_name)
                    else:
                        category = default_category # weak mapping for now

                    owner_id = row.get('owner_id')
                    owner = User.objects.filter(id=owner_id).first() if owner_id else None
                    
                    posted_by_id = row.get('posted_by_id')
                    posted_by = User.objects.filter(id=posted_by_id).first() if posted_by_id else None

                    defaults = {
                        'name': row.get('name', ''),
                        'breed': row.get('breed', ''),
                        'age': row.get('age') if row.get('age') else None,
                        'gender': row.get('gender', ''),
                        'size': row.get('size'),
                        'description': row.get('description', ''),
                        'adoption_status': row.get('adoption_status', 'Available for Adoption'),
                        'location': row.get('location', ''),
                        'pincode': row.get('pincode', ''),
                        'last_seen': self.parse_date(row.get('last_seen')),
                        'image': row.get('image', ''),
                        'created_at': self.parse_date(row.get('created_at')) or timezone.now(),
                        'updated_at': self.parse_date(row.get('updated_at')) or timezone.now(),
                        'is_verified': self.parse_bool(row.get('is_verified')),
                        'is_featured': self.parse_bool(row.get('is_featured')),
                        'views_count': int(row.get('views_count', 0)),
                        'category': category,
                        'owner': owner,
                        'posted_by': posted_by,
                        'days_in_care': int(row.get('days_in_care', 0)) if row.get('days_in_care') else 0,
                        'found_date': self.parse_date(row.get('found_date')),
                        'is_reunited': self.parse_bool(row.get('is_reunited')),
                        'moved_to_adoption': self.parse_bool(row.get('moved_to_adoption')),
                        'moved_to_adoption_date': self.parse_date(row.get('moved_to_adoption_date')),
                        'owner_consent_for_adoption': self.parse_bool(row.get('owner_consent_for_adoption')),
                        'reunited_at': self.parse_date(row.get('reunited_at')),
                        'cloudinary_url': row.get('cloudinary_url', ''),
                        'cloudinary_public_id': row.get('cloudinary_public_id', ''),
                        'image_url': row.get('cloudinary_url', '') if row.get('cloudinary_url') else '',
                    }
                    
                    if 'location_latitude' in row and row['location_latitude']:
                        defaults['location_latitude'] = row['location_latitude']
                    if 'location_longitude' in row and row['location_longitude']:
                        defaults['location_longitude'] = row['location_longitude']

                    pet, created = Pet.objects.update_or_create(id=pet_id, defaults=defaults)
                    
                    if created:
                        self.stdout.write(f"Created Pet {pet_id}")
                    else:
                        self.stdout.write(f"Updated Pet {pet_id}")
                    count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error importing pet row {row.get('id')}: {e}"))

            self.stdout.write(self.style.SUCCESS(f"Successfully processed {count} pets."))
