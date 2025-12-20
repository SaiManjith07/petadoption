# Generated manually to add image and is_deleted columns
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0008_add_message_type_column'),
    ]

    operations = [
        # Add image column if it doesn't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_message' 
                        AND column_name='image'
                    ) THEN
                        ALTER TABLE chats_message 
                        ADD COLUMN image VARCHAR(100) NULL;
                    END IF;
                END $$;
            """,
            reverse_sql="ALTER TABLE chats_message DROP COLUMN IF EXISTS image;",
        ),
        # Add is_deleted column if it doesn't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_message' 
                        AND column_name='is_deleted'
                    ) THEN
                        ALTER TABLE chats_message 
                        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
                    END IF;
                END $$;
            """,
            reverse_sql="ALTER TABLE chats_message DROP COLUMN IF EXISTS is_deleted;",
        ),
        # Add deleted_at column if it doesn't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_message' 
                        AND column_name='deleted_at'
                    ) THEN
                        ALTER TABLE chats_message 
                        ADD COLUMN deleted_at TIMESTAMP NULL;
                    END IF;
                END $$;
            """,
            reverse_sql="ALTER TABLE chats_message DROP COLUMN IF EXISTS deleted_at;",
        ),
    ]

