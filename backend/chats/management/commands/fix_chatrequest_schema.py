from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Fix chats_chatrequest table schema - rename owner_id to target_id'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check current state
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='chats_chatrequest' 
                AND column_name IN ('owner_id', 'target_id')
                ORDER BY column_name
            """)
            columns = [row[0] for row in cursor.fetchall()]
            self.stdout.write(f"Current columns: {columns}")
            
            # Check if owner_id exists
            has_owner_id = 'owner_id' in columns
            has_target_id = 'target_id' in columns
            
            if has_owner_id and not has_target_id:
                self.stdout.write(self.style.WARNING('Found owner_id but no target_id. Adding target_id...'))
                # Add target_id column
                cursor.execute("""
                    ALTER TABLE chats_chatrequest 
                    ADD COLUMN target_id BIGINT NULL;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Added target_id column'))
                
                # Add foreign key constraint
                cursor.execute("""
                    ALTER TABLE chats_chatrequest 
                    ADD CONSTRAINT chats_chatrequest_target_id_fkey 
                    FOREIGN KEY (target_id) REFERENCES users(id) ON DELETE CASCADE;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Added foreign key constraint'))
                
                # Copy data from owner_id to target_id
                cursor.execute("""
                    UPDATE chats_chatrequest 
                    SET target_id = owner_id 
                    WHERE target_id IS NULL AND owner_id IS NOT NULL;
                """)
                updated = cursor.rowcount
                self.stdout.write(self.style.SUCCESS(f'  ✓ Copied {updated} rows from owner_id to target_id'))
                
                # Make target_id NOT NULL
                cursor.execute("""
                    ALTER TABLE chats_chatrequest 
                    ALTER COLUMN target_id SET NOT NULL;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Made target_id NOT NULL'))
                
                # Drop owner_id
                cursor.execute("""
                    ALTER TABLE chats_chatrequest 
                    DROP CONSTRAINT IF EXISTS chats_chatrequest_owner_id_fkey;
                    ALTER TABLE chats_chatrequest DROP COLUMN owner_id;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Dropped owner_id column'))
                
            elif has_owner_id and has_target_id:
                self.stdout.write(self.style.WARNING('Both owner_id and target_id exist. Copying data and dropping owner_id...'))
                # Copy data
                cursor.execute("""
                    UPDATE chats_chatrequest 
                    SET target_id = owner_id 
                    WHERE target_id IS NULL AND owner_id IS NOT NULL;
                """)
                updated = cursor.rowcount
                self.stdout.write(self.style.SUCCESS(f'  ✓ Copied {updated} rows from owner_id to target_id'))
                
                # Drop owner_id
                cursor.execute("""
                    ALTER TABLE chats_chatrequest 
                    DROP CONSTRAINT IF EXISTS chats_chatrequest_owner_id_fkey;
                    ALTER TABLE chats_chatrequest DROP COLUMN owner_id;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Dropped owner_id column'))
                
            elif not has_owner_id and has_target_id:
                self.stdout.write(self.style.SUCCESS('Schema is correct - target_id exists, owner_id does not.'))
            else:
                self.stdout.write(self.style.ERROR('Neither owner_id nor target_id exists! This is unexpected.'))
            
            # Check owner_approved_at vs user_accepted_at
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='chats_chatrequest' 
                AND column_name IN ('owner_approved_at', 'user_accepted_at')
                ORDER BY column_name
            """)
            date_columns = [row[0] for row in cursor.fetchall()]
            
            if 'owner_approved_at' in date_columns and 'user_accepted_at' not in date_columns:
                self.stdout.write(self.style.WARNING('Renaming owner_approved_at to user_accepted_at...'))
                cursor.execute("""
                    ALTER TABLE chats_chatrequest 
                    RENAME COLUMN owner_approved_at TO user_accepted_at;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Renamed owner_approved_at to user_accepted_at'))
            elif 'user_accepted_at' in date_columns:
                self.stdout.write(self.style.SUCCESS('Date column is correct - user_accepted_at exists.'))
            
            self.stdout.write(self.style.SUCCESS('\nSchema fix completed!'))

