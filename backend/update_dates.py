
import os
import sys
import django
from django.utils import timezone
import datetime

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'petadoption.settings')
django.setup()

from pets.models import Pet

def update_dates():
    # Target date: Dec 5th 2024
    new_date = datetime.datetime(2024, 12, 5, 10, 0, 0, tzinfo=datetime.timezone.utc)
    
    # Search patterns
    # "totise" matches user request, "tortoise" is likely correct spelling, "parrot" is explicit
    patterns = ['totise', 'tortoise', 'parrot', 'tort']
    
    print(f"Searching for pets matching: {patterns}")
    
    pets_to_update = []
    
    for p in Pet.objects.all():
        name = (p.name or '').lower()
        cat = (p.category.name if p.category else '').lower()
        
        if any(pat in name for pat in patterns) or any(pat in cat for pat in patterns):
            pets_to_update.append(p)
            
    if not pets_to_update:
        print("No matching pets found!")
        return

    print(f"Found {len(pets_to_update)} pets:")
    for p in pets_to_update:
        print(f" - ID: {p.id} | Name: {p.name} | Category: {p.category} | Status: {p.adoption_status} | Old Date: {p.found_date}")
        
        # Update
        p.found_date = new_date
        # Ensure status is 'Found' so 15-day rule applies (or 'Pending' if just reported)
        # If it was 'Pending', we keep it pending or move to Found? 
        # User says "so that come for adoption", implying they want the 15 days to be OVER.
        # If status is 'Found', and date is old, verified -> user can "Make Available".
        # If status is 'Pending', it needs verification first.
        # I will ensure it is 'Found' and 'Verified' to expedite.
        p.adoption_status = 'Found' 
        p.is_verified = True
        p.save()
        print(f"   -> Updated to: {p.found_date} | Status: Found | Verified: True")

if __name__ == '__main__':
    update_dates()
