
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

try:
    user = User.objects.get(email='admin@petreunite.com')
    user.set_password('admin123')
    user.save()
    print("Superuser exists. Password updated to: admin123")
except User.DoesNotExist:
    print("Creating superuser...")
    User.objects.create_superuser(email='admin@petreunite.com', password='admin123', name='Admin User')
    print("Superuser created: admin@petreunite.com / admin123")
