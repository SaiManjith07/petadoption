# Generated migration for adding Cloudinary fields to Message model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0010_add_verified_by_admin'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='cloudinary_url',
            field=models.URLField(blank=True, help_text='Cloudinary URL for the chat image', null=True),
        ),
        migrations.AddField(
            model_name='message',
            name='cloudinary_public_id',
            field=models.CharField(blank=True, help_text='Cloudinary public_id for the chat image', max_length=255, null=True),
        ),
    ]

