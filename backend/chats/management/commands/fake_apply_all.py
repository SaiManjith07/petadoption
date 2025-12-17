from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Fake-apply all remaining migrations that have existing database structures'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('This will fake-apply all migrations. Use with caution!'))
        
        # Get all apps
        from django.apps import apps
        from django.db.migrations.loader import MigrationLoader
        from django.db import connections
        
        connection = connections['default']
        loader = MigrationLoader(connection)
        
        # Get all unapplied migrations
        applied = set(loader.applied_migrations.keys())
        all_migrations = loader.disk_migrations
        
        # Fake-apply all unapplied migrations
        now = timezone.now()
        fake_applied = 0
        
        with connection.cursor() as cursor:
            for key, migration in all_migrations.items():
                if key not in applied:
                    app_label, migration_name = key
                    self.stdout.write(f'Fake-applying {app_label}.{migration_name}...')
                    try:
                        cursor.execute("""
                            INSERT INTO django_migrations (app, name, applied)
                            VALUES (%s, %s, %s)
                            ON CONFLICT DO NOTHING
                        """, [app_label, migration_name, now])
                        fake_applied += 1
                        self.stdout.write(self.style.SUCCESS(f'  ✓ Fake-applied {app_label}.{migration_name}'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'  ✗ Error: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nFake-applied {fake_applied} migrations!'))
        self.stdout.write(self.style.WARNING('Now run: python manage.py migrate --fake'))

