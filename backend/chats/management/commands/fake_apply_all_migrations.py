from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
from django.core.management import call_command
import sys


class Command(BaseCommand):
    help = 'Fake-apply all pending migrations to fix dependency issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force fake-apply even if migrations are already applied',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('This will fake-apply all migrations. Use with caution!'))
        
        # Get all unapplied migrations
        try:
            from django.db.migrations.executor import MigrationExecutor
            from django.db import connections
            from django.apps import apps
            
            connection = connections['default']
            executor = MigrationExecutor(connection)
            loader = executor.loader
            
            # Get all migrations
            all_migrations = {}
            for app_config in apps.get_app_configs():
                if hasattr(app_config, 'migrations_module') and app_config.migrations_module:
                    try:
                        migrations = loader.disk_migrations
                        for key, migration in migrations.items():
                            if key[0] == app_config.label:
                                all_migrations[key] = migration
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error loading migrations for {app_config.label}: {e}'))
            
            # Get applied migrations
            applied = set(loader.applied_migrations.keys())
            
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
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            import traceback
            self.stdout.write(traceback.format_exc())

