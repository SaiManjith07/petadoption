
import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pets.models import Pet

def update_marks():
    DISTINGUISHING_MARKS = [
        "Has a white patch on the chest.",
        "Small scar on the left ear.",
        "Very fluffy tail.",
        "Heterochromia (different colored eyes).",
        "Limping slightly on the right leg.",
        "Wears a red collar with a bell.",
        "Black spots on the back.",
        "Missing a small part of the tail."
    ]

    pets = Pet.objects.all()
    print(f"Found {pets.count()} pets to update.")

    for pet in pets:
        if not pet.distinguishing_marks:
            mark = random.choice(DISTINGUISHING_MARKS)
            pet.distinguishing_marks = mark
            pet.save()
            print(f"Updated {pet.name}: {mark}")
        else:
            print(f"Skipping {pet.name}, already has marks.")

    print("Done updating pet marks.")

if __name__ == "__main__":
    update_marks()
