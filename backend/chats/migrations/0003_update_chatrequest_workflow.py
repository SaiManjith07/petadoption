# Migration to update ChatRequest for new workflow
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0002_chatrequest'),
        ('pets', '0004_add_weight_tag_location_fields'),
    ]

    operations = [
        # Add target field if it doesn't exist
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' AND column_name='target_id'
                    ) THEN
                        ALTER TABLE chats_chatrequest ADD COLUMN target_id INTEGER NULL;
                        ALTER TABLE chats_chatrequest 
                        ADD CONSTRAINT chats_chatrequest_target_id_fkey 
                        FOREIGN KEY (target_id) REFERENCES users_user(id) ON DELETE CASCADE;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Copy data from owner to target if owner exists
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' AND column_name='owner_id'
                    ) THEN
                        UPDATE chats_chatrequest 
                        SET target_id = owner_id 
                        WHERE target_id IS NULL AND owner_id IS NOT NULL;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Make target required
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' AND column_name='target_id' AND is_nullable='YES'
                    ) THEN
                        ALTER TABLE chats_chatrequest ALTER COLUMN target_id SET NOT NULL;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Remove owner field if it exists
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' AND column_name='owner_id'
                    ) THEN
                        ALTER TABLE chats_chatrequest 
                        DROP CONSTRAINT IF EXISTS chats_chatrequest_owner_id_fkey;
                        ALTER TABLE chats_chatrequest DROP COLUMN owner_id;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Rename owner_approved_at to user_accepted_at if it exists
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' AND column_name='owner_approved_at'
                    ) AND NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='chats_chatrequest' AND column_name='user_accepted_at'
                    ) THEN
                        ALTER TABLE chats_chatrequest 
                        RENAME COLUMN owner_approved_at TO user_accepted_at;
                    END IF;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Update status field choices
        migrations.AlterField(
            model_name='chatrequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending Admin Approval'),
                    ('admin_approved', 'Admin Approved - Pending User Acceptance'),
                    ('active', 'Active Chat'),
                    ('rejected', 'Rejected'),
                ],
                default='pending',
                max_length=20
            ),
        ),
        # Update type field choices and default
        migrations.AlterField(
            model_name='chatrequest',
            name='type',
            field=models.CharField(
                choices=[('claim', 'Claim'), ('adoption', 'Adoption'), ('general', 'General')],
                default='general',
                max_length=20
            ),
        ),
        # Make pet optional
        migrations.AlterField(
            model_name='chatrequest',
            name='pet',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='chat_requests',
                to='pets.pet'
            ),
        ),
        # Update indexes - drop old, add new
        migrations.RunSQL(
            sql="""
                DROP INDEX IF EXISTS chats_chatr_pet_id_15cfd8_idx;
                DROP INDEX IF EXISTS chats_chatr_owner_i_c34c77_idx;
                CREATE INDEX IF NOT EXISTS chats_chatr_request_idx ON chats_chatrequest(requester_id, status);
                CREATE INDEX IF NOT EXISTS chats_chatr_target_idx ON chats_chatrequest(target_id, status);
                CREATE INDEX IF NOT EXISTS chats_chatr_status_idx ON chats_chatrequest(status);
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Add unique constraint
        migrations.RunSQL(
            sql="""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'chats_chatrequest_requester_target_status_uniq'
                    ) THEN
                        ALTER TABLE chats_chatrequest 
                        ADD CONSTRAINT chats_chatrequest_requester_target_status_uniq 
                        UNIQUE (requester_id, target_id, status);
                    END IF;
                END $$;
            """,
            reverse_sql="""
                ALTER TABLE chats_chatrequest 
                DROP CONSTRAINT IF EXISTS chats_chatrequest_requester_target_status_uniq;
            """,
        ),
    ]

