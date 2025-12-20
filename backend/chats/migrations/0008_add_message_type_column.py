# Generated manually to add message_type column
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0007_add_missing_fields'),
    ]

    operations = [
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
                        ADD COLUMN message_type VARCHAR(10) DEFAULT 'text';
                        
                        -- Add constraint if it doesn't exist
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE table_name='chats_message' 
                            AND constraint_name='chats_message_message_type_check'
                        ) THEN
                            ALTER TABLE chats_message 
                            ADD CONSTRAINT chats_message_message_type_check 
                            CHECK (message_type IN ('text', 'image'));
                        END IF;
                        
                        -- Update existing rows to 'text' (default)
                        UPDATE chats_message 
                        SET message_type = 'text';
                    END IF;
                END $$;
            """,
            reverse_sql="ALTER TABLE chats_message DROP COLUMN IF EXISTS message_type;",
        ),
    ]

