# Generated manually to add missing fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0006_chatrequest_target'),
        migrations.swappable_dependency('users.user'),
    ]

    operations = [
        # Add admin_verification_room if it doesn't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' 
                        AND column_name='admin_verification_room_id'
                    ) THEN
                        ALTER TABLE chats_chatrequest 
                        ADD COLUMN admin_verification_room_id INTEGER 
                        REFERENCES chats_chatroom(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            """,
            reverse_sql="ALTER TABLE chats_chatrequest DROP COLUMN IF EXISTS admin_verification_room_id;",
        ),
        # Add final_chat_room if it doesn't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' 
                        AND column_name='final_chat_room_id'
                    ) THEN
                        ALTER TABLE chats_chatrequest 
                        ADD COLUMN final_chat_room_id INTEGER 
                        REFERENCES chats_chatroom(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            """,
            reverse_sql="ALTER TABLE chats_chatrequest DROP COLUMN IF EXISTS final_chat_room_id;",
        ),
        # Add message_type if it doesn't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_message' 
                        AND column_name='message_type'
                    ) THEN
                        ALTER TABLE chats_message 
                        ADD COLUMN message_type VARCHAR(10) DEFAULT 'text' 
                        CHECK (message_type IN ('text', 'image'));
                    END IF;
                END $$;
            """,
            reverse_sql="ALTER TABLE chats_message DROP COLUMN IF EXISTS message_type;",
        ),
    ]

