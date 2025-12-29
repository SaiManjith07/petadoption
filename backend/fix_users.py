import os
import sys
import django

# Add the project root to the Python path
sys.path.append(os.path.dirname(__file__))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def verify_all_users():
    print("Starting user activation...")
    users = User.objects.all()
    count = 0
    for user in users:
        changed = False
        # User model does NOT have is_verified, so we skip that.
        # We only set is_active.
        if not user.is_active:
            user.is_active = True
            changed = True
        
        if changed:
            user.save()
            print(f"Activated user: {user.email}")
            count += 1
        else:
            print(f"User already active: {user.email}")
            
    print(f"Completed! {count} users updated.")

if __name__ == "__main__":
    verify_all_users()
