# Generated migration to fix user schema mismatch
from django.db import migrations, models
import django.utils.timezone


def migrate_old_to_new_schema(apps, schema_editor):
    """Migrate data from old schema to new schema."""
    User = apps.get_model('users', 'User')
    db_alias = schema_editor.connection.alias
    
    # Check if old columns exist
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('first_name', 'last_name', 'username', 'avatar')
        """)
        old_columns = {row[0] for row in cursor.fetchall()}
    
    if old_columns:
        # Update existing users: combine first_name + last_name into name
        if 'first_name' in old_columns and 'last_name' in old_columns:
            with schema_editor.connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE users 
                    SET name = COALESCE(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), email)
                    WHERE name IS NULL OR name = ''
                """)
        
        # Copy avatar to profile_image if exists
        if 'avatar' in old_columns:
            with schema_editor.connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE users 
                    SET profile_image = avatar
                    WHERE profile_image IS NULL AND avatar IS NOT NULL
                """)


def reverse_migration(apps, schema_editor):
    """Reverse migration - not fully reversible."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # Add new columns
        migrations.AddField(
            model_name='user',
            name='name',
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='country_code',
            field=models.CharField(default='+91', max_length=5),
        ),
        migrations.AddField(
            model_name='user',
            name='address',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='landmark',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='profile_image',
            field=models.ImageField(blank=True, null=True, upload_to='profiles/'),
        ),
        
        # Migrate data from old schema
        migrations.RunPython(migrate_old_to_new_schema, reverse_migration),
        
        # Make name required (after data migration)
        migrations.AlterField(
            model_name='user',
            name='name',
            field=models.CharField(max_length=255),
        ),
        
        # Remove old columns (if they exist)
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS username;",
            reverse_sql="ALTER TABLE users ADD COLUMN username VARCHAR(150) NOT NULL DEFAULT '';",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS first_name;",
            reverse_sql="ALTER TABLE users ADD COLUMN first_name VARCHAR(150) NOT NULL DEFAULT '';",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS last_name;",
            reverse_sql="ALTER TABLE users ADD COLUMN last_name VARCHAR(150) NOT NULL DEFAULT '';",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS avatar;",
            reverse_sql="ALTER TABLE users ADD COLUMN avatar VARCHAR(100) NULL;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS agree_terms;",
            reverse_sql="ALTER TABLE users ADD COLUMN agree_terms BOOLEAN NOT NULL DEFAULT FALSE;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS terms_agreed_at;",
            reverse_sql="ALTER TABLE users ADD COLUMN terms_agreed_at TIMESTAMP WITH TIME ZONE NULL;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS is_banned;",
            reverse_sql="ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT FALSE;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS is_rescuer_approved;",
            reverse_sql="ALTER TABLE users ADD COLUMN is_rescuer_approved BOOLEAN NOT NULL DEFAULT FALSE;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS created_at;",
            reverse_sql="ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users DROP COLUMN IF EXISTS updated_at;",
            reverse_sql="ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();",
        ),
    ]
