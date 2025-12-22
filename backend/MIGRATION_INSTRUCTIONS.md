# Migration Instructions for Cloudinary Integration

## Migration File Created
The migration file `0005_add_cloudinary_fields.py` has been created in `backend/pets/migrations/`.

## To Apply the Migration

### Option 1: Using the batch script (Windows)
```bash
cd backend
apply_migrations.bat
```

### Option 2: Manual commands
```bash
cd backend

# Activate virtual environment if you have one
# venv\Scripts\activate  (Windows)
# source venv/bin/activate  (Linux/Mac)

# Apply migrations
python manage.py migrate pets
```

### Option 3: Apply all migrations
```bash
cd backend
python manage.py migrate
```

## Verify Migration

After running the migration, verify the fields were added:

```bash
python manage.py showmigrations pets
```

You should see `0005_add_cloudinary_fields` marked as applied.

## Database Changes

The migration adds the following fields:

### Pet Model:
- `cloudinary_url` (URLField, nullable)
- `cloudinary_public_id` (CharField, max_length=255, nullable)

### PetImage Model:
- `cloudinary_url` (URLField, nullable)
- `cloudinary_public_id` (CharField, max_length=255, nullable)

## Next Steps

1. Run the migration using one of the options above
2. Test by creating a new pet with an image
3. Verify the `cloudinary_url` is populated in the database
4. Check Cloudinary dashboard to see uploaded images

## Troubleshooting

If you encounter issues:
- Make sure Python is in your PATH
- Activate your virtual environment if you have one
- Check that Django is installed: `pip install -r requirements.txt`
- Verify database connection in settings.py

