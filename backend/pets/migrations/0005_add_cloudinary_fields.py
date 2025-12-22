# Generated migration for Cloudinary integration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pets', '0004_add_weight_tag_location_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='pet',
            name='cloudinary_url',
            field=models.URLField(blank=True, help_text='Cloudinary URL for the main image', null=True),
        ),
        migrations.AddField(
            model_name='pet',
            name='cloudinary_public_id',
            field=models.CharField(blank=True, help_text='Cloudinary public_id for the main image', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='petimage',
            name='cloudinary_url',
            field=models.URLField(blank=True, help_text='Cloudinary URL for this image', null=True),
        ),
        migrations.AddField(
            model_name='petimage',
            name='cloudinary_public_id',
            field=models.CharField(blank=True, help_text='Cloudinary public_id for this image', max_length=255, null=True),
        ),
    ]

