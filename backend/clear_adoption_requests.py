import os
import sys
import django

# Add the current directory to sys.path so we can import from the project
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'petadoption.settings')
django.setup()

from pets.models import AdoptionApplication, Pet

def clear_requests():
    # 1. Delete all adoption applications
    apps_count = AdoptionApplication.objects.count()
    AdoptionApplication.objects.all().delete()
    print(f"Deleted {apps_count} adoption applications.")

    # 2. Reset pets with 'Pending Adoption' status to 'Available for Adoption'
    # We are careful NOT to touch 'Pending' (which is for Found/Lost verification)
    cutoff_status = 'Pending Adoption'
    pets_to_reset = Pet.objects.filter(adoption_status=cutoff_status)
    pets_count = pets_to_reset.count()
    
    if pets_count > 0:
        pets_to_reset.update(adoption_status='Available for Adoption')
        print(f"Reset {pets_count} pets from '{cutoff_status}' to 'Available for Adoption'.")
    else:
        print(f"No pets found with status '{cutoff_status}'.")

    # Double check for any other variations if necessary, but 'Pending Adoption' is the main one used in AdminAdopt.tsx filtering
    
    print("Done. Total pet adoption requests should now be zero.")

if __name__ == '__main__':
    clear_requests()
