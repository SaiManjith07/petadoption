from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone


class Command(BaseCommand):
    help = 'Fix all migration dependencies by removing and re-adding problematic migrations'

    def handle(self, *args, **options):
        now = timezone.now()
        
        with connection.cursor() as cursor:
            # Remove all problematic migrations that are applied out of order
            problematic_migrations = [
                ('pets', '0004_add_weight_tag_location_fields'),
                ('chats', '0002_chatrequest'),
                ('chats', '0003_update_chatrequest_workflow'),
                ('chats', '0004_add_chatroom_fields'),
            ]
            
            self.stdout.write(self.style.WARNING('Removing problematic migrations...'))
            for app, migration_name in problematic_migrations:
                cursor.execute("""
                    DELETE FROM django_migrations 
                    WHERE app = %s AND name = %s
                """, [app, migration_name])
                self.stdout.write(f'  Removed {app}.{migration_name}')
            
            # Now fake-apply all migrations in correct order
            # IMPORTANT: Apply in dependency order - Django built-in apps first
            
            # First, fake-apply contenttypes migrations (must be first)
            self.stdout.write(self.style.WARNING('\nFake-applying contenttypes migrations...'))
            contenttypes_migrations = ['0001_initial', '0002_remove_content_type_name']
            for migration_name in contenttypes_migrations:
                cursor.execute("""
                    SELECT name FROM django_migrations 
                    WHERE app = 'contenttypes' AND name = %s
                """, [migration_name])
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO django_migrations (app, name, applied)
                        VALUES ('contenttypes', %s, %s)
                        ON CONFLICT DO NOTHING
                    """, [migration_name, now])
                    self.stdout.write(f'  ✓ Fake-applied contenttypes.{migration_name}')
            
            # Then, ensure all 0001_initial migrations are applied in correct order
            apps_with_initial_ordered = [
                'auth',  # Must be before users
                'admin',
                'sessions',
                'token_blacklist',
                'users',  # Depends on auth
                'pets',  # Depends on users
                'chats',  # Depends on users
                'adminpanel',  # Depends on users
                'notifications',
                'health',
                'api',
            ]
            
            self.stdout.write(self.style.WARNING('\nFake-applying base migrations in dependency order...'))
            for app in apps_with_initial_ordered:
                cursor.execute("""
                    SELECT name FROM django_migrations 
                    WHERE app = %s AND name = '0001_initial'
                """, [app])
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO django_migrations (app, name, applied)
                        VALUES (%s, '0001_initial', %s)
                        ON CONFLICT DO NOTHING
                    """, [app, now])
                    self.stdout.write(f'  ✓ Fake-applied {app}.0001_initial')
            
            # Fake-apply all auth migrations in order (they're dependencies for users)
            # Auth migrations from 0001 to 0012 need to be applied before users.0001_initial
            auth_migrations = [
                '0001_initial',
                '0002_alter_permission_name_max_length',
                '0003_alter_user_email_max_length',
                '0004_alter_user_username_opts',
                '0005_alter_user_last_login_null',
                '0006_require_contenttypes_0002',
                '0007_alter_validators_add_error_messages',
                '0008_alter_user_username_max_length',
                '0009_alter_user_last_name_max_length',
                '0010_alter_group_name_max_length',
                '0011_update_proxy_permissions',
                '0012_alter_user_first_name_max_length',
            ]
            
            self.stdout.write(self.style.WARNING('Fake-applying auth migrations in order...'))
            for migration_name in auth_migrations:
                cursor.execute("""
                    SELECT name FROM django_migrations 
                    WHERE app = 'auth' AND name = %s
                """, [migration_name])
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO django_migrations (app, name, applied)
                        VALUES ('auth', %s, %s)
                        ON CONFLICT DO NOTHING
                    """, [migration_name, now])
                    self.stdout.write(f'  ✓ Fake-applied auth.{migration_name}')
            
            # If users.0001_initial is applied but auth.0012 is not, remove users.0001_initial
            cursor.execute("""
                SELECT name FROM django_migrations 
                WHERE app = 'users' AND name = '0001_initial'
            """)
            has_users_initial = cursor.fetchone() is not None
            
            cursor.execute("""
                SELECT name FROM django_migrations 
                WHERE app = 'auth' AND name = '0012_alter_user_first_name_max_length'
            """)
            has_auth_0012 = cursor.fetchone() is not None
            
            if has_users_initial and not has_auth_0012:
                self.stdout.write(self.style.WARNING('Removing users.0001_initial to fix dependency...'))
                cursor.execute("""
                    DELETE FROM django_migrations 
                    WHERE app = 'users' AND name = '0001_initial'
                """)
                # Re-apply it after auth.0012
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('users', '0001_initial', %s)
                    ON CONFLICT DO NOTHING
                """, [now])
                self.stdout.write(f'  ✓ Re-applied users.0001_initial after auth.0012')
            
            self.stdout.write(self.style.SUCCESS('\nMigration history reset! Now run: python manage.py migrate'))
