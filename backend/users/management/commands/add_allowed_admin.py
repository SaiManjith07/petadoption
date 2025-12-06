"""
Management command to add allowed admin emails.
Usage: python manage.py add_allowed_admin email@example.com "Name"
"""
from django.core.management.base import BaseCommand
from users.models import AllowedAdminEmail


class Command(BaseCommand):
    help = 'Add an email to the allowed admin emails list'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address to add')
        parser.add_argument('name', type=str, nargs='?', default='', help='Optional name for reference')

    def handle(self, *args, **options):
        email = options['email'].lower()
        name = options['name'] or ''
        
        # Check if email already exists
        existing = AllowedAdminEmail.objects.filter(email=email).first()
        if existing:
            if existing.is_active:
                self.stdout.write(self.style.WARNING(f'Email {email} is already in the allowed list and is active.'))
            else:
                existing.is_active = True
                existing.name = name if name else existing.name
                existing.save()
                self.stdout.write(self.style.SUCCESS(f'Email {email} has been reactivated in the allowed list.'))
        else:
            AllowedAdminEmail.objects.create(email=email, name=name, is_active=True)
            self.stdout.write(self.style.SUCCESS(f'Successfully added {email} to the allowed admin emails list.'))

