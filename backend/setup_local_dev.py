import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model

def setup():
    db_path = settings.BASE_DIR / 'db.sqlite3'
    if db_path.exists():
        print("Removing existing db.sqlite3...")
        os.remove(db_path)
    
    print("Running migrations...")
    try:
        call_command('migrate')
    except Exception as e:
        print(f"Migration failed: {e}")
        return

    print("Creating superuser...")
    User = get_user_model()
    if not User.objects.filter(email='admin@example.com').exists():
        # Corrected: email, password, and required fields (name)
        User.objects.create_superuser(email='admin@example.com', password='admin123', name='Admin')
        print("Superuser 'admin' created.")
    else:
        print("Superuser 'admin' already exists.")

if __name__ == '__main__':
    setup()
