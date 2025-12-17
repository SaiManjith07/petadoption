from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Fix chats_chatroom table schema - add user_a_id, user_b_id, chat_request_id columns'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check current state
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='chats_chatroom' 
                AND column_name IN ('user_a_id', 'user_b_id', 'chat_request_id')
                ORDER BY column_name
            """)
            columns = [row[0] for row in cursor.fetchall()]
            self.stdout.write(f"Current columns: {columns}")
            
            # Add user_a_id if missing
            if 'user_a_id' not in columns:
                self.stdout.write(self.style.WARNING('Adding user_a_id column...'))
                cursor.execute("""
                    ALTER TABLE chats_chatroom 
                    ADD COLUMN user_a_id BIGINT NULL;
                """)
                cursor.execute("""
                    ALTER TABLE chats_chatroom 
                    ADD CONSTRAINT chats_chatroom_user_a_id_fkey 
                    FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Added user_a_id column'))
            else:
                self.stdout.write(self.style.SUCCESS('  ✓ user_a_id already exists'))
            
            # Add user_b_id if missing
            if 'user_b_id' not in columns:
                self.stdout.write(self.style.WARNING('Adding user_b_id column...'))
                cursor.execute("""
                    ALTER TABLE chats_chatroom 
                    ADD COLUMN user_b_id BIGINT NULL;
                """)
                cursor.execute("""
                    ALTER TABLE chats_chatroom 
                    ADD CONSTRAINT chats_chatroom_user_b_id_fkey 
                    FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Added user_b_id column'))
            else:
                self.stdout.write(self.style.SUCCESS('  ✓ user_b_id already exists'))
            
            # Add chat_request_id if missing
            if 'chat_request_id' not in columns:
                self.stdout.write(self.style.WARNING('Adding chat_request_id column...'))
                cursor.execute("""
                    ALTER TABLE chats_chatroom 
                    ADD COLUMN chat_request_id INTEGER NULL;
                """)
                cursor.execute("""
                    ALTER TABLE chats_chatroom 
                    ADD CONSTRAINT chats_chatroom_chat_request_id_fkey 
                    FOREIGN KEY (chat_request_id) REFERENCES chats_chatrequest(id) ON DELETE SET NULL;
                """)
                # Add unique constraint for OneToOne relationship
                cursor.execute("""
                    DO $$ 
                    BEGIN 
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'chats_chatroom_chat_request_id_key'
                        ) THEN
                            ALTER TABLE chats_chatroom 
                            ADD CONSTRAINT chats_chatroom_chat_request_id_key UNIQUE (chat_request_id);
                        END IF;
                    END $$;
                """)
                self.stdout.write(self.style.SUCCESS('  ✓ Added chat_request_id column'))
            else:
                self.stdout.write(self.style.SUCCESS('  ✓ chat_request_id already exists'))
            
            self.stdout.write(self.style.SUCCESS('\nSchema fix completed!'))

