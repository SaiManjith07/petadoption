# Generated migration to add ChatRoom fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0003_update_chatrequest_workflow'),
        ('users', '0001_initial'),
    ]

    operations = [
        # Check if table exists first, then add fields
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    -- Check if table exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name='chats_chatroom'
                    ) THEN
                        -- Add room_id field if it doesn't exist
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='chats_chatroom' AND column_name='room_id'
                        ) THEN
                            ALTER TABLE chats_chatroom ADD COLUMN room_id VARCHAR(100) NULL;
                            CREATE INDEX IF NOT EXISTS chats_chatroom_room_id_idx ON chats_chatroom(room_id);
                        END IF;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Add user_a field if table and field don't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name='chats_chatroom'
                    ) AND EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name='users_user'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='chats_chatroom' AND column_name='user_a_id'
                        ) THEN
                            ALTER TABLE chats_chatroom ADD COLUMN user_a_id INTEGER NULL;
                            ALTER TABLE chats_chatroom 
                            ADD CONSTRAINT chats_chatroom_user_a_id_fkey 
                            FOREIGN KEY (user_a_id) REFERENCES users_user(id) ON DELETE CASCADE;
                        END IF;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Add user_b field if table and field don't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name='chats_chatroom'
                    ) AND EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name='users_user'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='chats_chatroom' AND column_name='user_b_id'
                        ) THEN
                            ALTER TABLE chats_chatroom ADD COLUMN user_b_id INTEGER NULL;
                            ALTER TABLE chats_chatroom 
                            ADD CONSTRAINT chats_chatroom_user_b_id_fkey 
                            FOREIGN KEY (user_b_id) REFERENCES users_user(id) ON DELETE CASCADE;
                        END IF;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Add chat_request field if table and field don't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name='chats_chatroom'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='chats_chatroom' AND column_name='chat_request_id'
                        ) THEN
                            ALTER TABLE chats_chatroom ADD COLUMN chat_request_id INTEGER NULL;
                            ALTER TABLE chats_chatroom 
                            ADD CONSTRAINT chats_chatroom_chat_request_id_fkey 
                            FOREIGN KEY (chat_request_id) REFERENCES chats_chatrequest(id) ON DELETE SET NULL;
                            CREATE UNIQUE INDEX IF NOT EXISTS chats_chatroom_chat_request_id_key ON chats_chatroom(chat_request_id);
                        END IF;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Add unique constraint on user_a, user_b (only if columns exist)
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name='chats_chatroom'
                    ) AND EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatroom' AND column_name='user_a_id'
                    ) AND EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatroom' AND column_name='user_b_id'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'unique_user_pair'
                        ) THEN
                            ALTER TABLE chats_chatroom 
                            ADD CONSTRAINT unique_user_pair 
                            UNIQUE (user_a_id, user_b_id);
                        END IF;
                    END IF;
                END $$;
            """,
            reverse_sql="""
                ALTER TABLE chats_chatroom 
                DROP CONSTRAINT IF EXISTS unique_user_pair;
            """,
        ),
    ]

