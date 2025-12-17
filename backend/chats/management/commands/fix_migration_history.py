from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone


class Command(BaseCommand):
    help = 'Fix inconsistent migration history by ensuring proper migration order'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check which migrations are applied
            migrations_to_check = [
                '0001_initial',
                '0002_chatrequest',
                '0003_update_chatrequest_workflow',
                '0004_add_chatroom_fields',
            ]
            
            applied_migrations = {}
            for migration_name in migrations_to_check:
                cursor.execute("""
                    SELECT name FROM django_migrations 
                    WHERE app = 'chats' AND name = %s
                """, [migration_name])
                applied_migrations[migration_name] = cursor.fetchone() is not None
                self.stdout.write(f"{migration_name} applied: {applied_migrations[migration_name]}")
            
            # Remove 0004 if it's applied before its dependencies
            if applied_migrations.get('0004_add_chatroom_fields') and (
                not applied_migrations.get('0003_update_chatrequest_workflow') or
                not applied_migrations.get('0002_chatrequest')
            ):
                self.stdout.write(self.style.WARNING('Removing 0004_add_chatroom_fields from migration history...'))
                cursor.execute("""
                    DELETE FROM django_migrations 
                    WHERE app = 'chats' AND name = '0004_add_chatroom_fields'
                """)
                self.stdout.write(self.style.SUCCESS('Removed 0004 from migration history'))
            
            # Remove 0003 if it's applied before its dependencies
            if applied_migrations.get('0003_update_chatrequest_workflow') and not applied_migrations.get('0002_chatrequest'):
                self.stdout.write(self.style.WARNING('Removing 0003_update_chatrequest_workflow from migration history...'))
                cursor.execute("""
                    DELETE FROM django_migrations 
                    WHERE app = 'chats' AND name = '0003_update_chatrequest_workflow'
                """)
                self.stdout.write(self.style.SUCCESS('Removed 0003 from migration history'))
            
            # Fake-apply missing migrations in order
            now = timezone.now()
            if not applied_migrations.get('0002_chatrequest'):
                self.stdout.write(self.style.WARNING('Fake-applying 0002_chatrequest...'))
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('chats', '0002_chatrequest', %s)
                    ON CONFLICT DO NOTHING
                """, [now])
                self.stdout.write(self.style.SUCCESS('Fake-applied 0002'))
            
            if not applied_migrations.get('0003_update_chatrequest_workflow'):
                self.stdout.write(self.style.WARNING('Fake-applying 0003_update_chatrequest_workflow...'))
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('chats', '0003_update_chatrequest_workflow', %s)
                    ON CONFLICT DO NOTHING
                """, [now])
                self.stdout.write(self.style.SUCCESS('Fake-applied 0003'))
            
            # Fake-apply chats.0001_initial if needed
            if not applied_migrations.get('0001_initial'):
                self.stdout.write(self.style.WARNING('Fake-applying chats.0001_initial...'))
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('chats', '0001_initial', %s)
                    ON CONFLICT DO NOTHING
                """, [now])
                self.stdout.write(self.style.SUCCESS('Fake-applied chats.0001_initial'))
            
            # Fake-apply base migrations for all apps if they don't exist
            base_apps = ['users', 'pets', 'adminpanel', 'notifications', 'health', 'api']
            for app in base_apps:
                cursor.execute("""
                    SELECT name FROM django_migrations 
                    WHERE app = %s AND name = '0001_initial'
                """, [app])
                has_initial = cursor.fetchone() is not None
                
                if not has_initial:
                    self.stdout.write(self.style.WARNING(f'Fake-applying {app}.0001_initial...'))
                    try:
                        cursor.execute("""
                            INSERT INTO django_migrations (app, name, applied)
                            VALUES (%s, '0001_initial', %s)
                            ON CONFLICT DO NOTHING
                        """, [app, now])
                        self.stdout.write(self.style.SUCCESS(f'Fake-applied {app}.0001_initial'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error fake-applying {app}.0001_initial: {e}'))
            
            # Also check and fix pets migration if needed
            cursor.execute("""
                SELECT name FROM django_migrations 
                WHERE app = 'pets' AND name = '0004_add_weight_tag_location_fields'
            """)
            has_pets_0004 = cursor.fetchone() is not None
            
            if not has_pets_0004 and applied_migrations.get('0002_chatrequest'):
                self.stdout.write(self.style.WARNING('Fake-applying pets.0004_add_weight_tag_location_fields...'))
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('pets', '0004_add_weight_tag_location_fields', %s)
                    ON CONFLICT DO NOTHING
                """, [now])
                self.stdout.write(self.style.SUCCESS('Fake-applied pets.0004'))
            
            self.stdout.write(self.style.SUCCESS('Migration history fixed! You can now run: python manage.py migrate'))

