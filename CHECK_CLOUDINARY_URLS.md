# How to Check Cloudinary URLs in Database

## Database Tables and Fields

### 1. Pet Table (Main Pet Images)
**Table Name**: `pets_pet`

**Fields to Check**:
- `cloudinary_url` - The full Cloudinary URL (e.g., `https://res.cloudinary.com/drp2hx5d6/image/upload/v1234567890/petadoption/pets/pet_1_main.jpg`)
- `cloudinary_public_id` - The Cloudinary public ID (e.g., `petadoption/pets/pet_1_main`)
- `image` - Local image path (fallback, still stored)
- `image_url` - External URL (if provided)

### 2. PetImage Table (Additional Pet Images)
**Table Name**: `pets_petimage`

**Fields to Check**:
- `cloudinary_url` - The full Cloudinary URL for additional images
- `cloudinary_public_id` - The Cloudinary public ID
- `image` - Local image path (fallback)
- `pet_id` - Foreign key to the Pet table

## Methods to Check URLs

### Method 1: Django Admin Panel
1. Go to: `http://localhost:8000/admin/`
2. Login with admin credentials
3. Navigate to **Pets** → **Pets**
4. Click on any pet
5. Look for fields:
   - **Cloudinary url**: Shows the full Cloudinary URL
   - **Cloudinary public id**: Shows the public ID

### Method 2: Database Query (PostgreSQL/Neon)
```sql
-- Check main pet images with Cloudinary URLs
SELECT 
    id,
    name,
    cloudinary_url,
    cloudinary_public_id,
    image,
    image_url
FROM pets_pet
WHERE cloudinary_url IS NOT NULL
ORDER BY created_at DESC;

-- Check additional pet images
SELECT 
    id,
    pet_id,
    cloudinary_url,
    cloudinary_public_id,
    caption
FROM pets_petimage
WHERE cloudinary_url IS NOT NULL
ORDER BY created_at DESC;
```

### Method 3: Django Shell
```bash
# Activate virtual environment and run Django shell
C:\Users\HP\Desktop\PK\petadoption\petadoption\Scripts\python.exe manage.py shell

# Then in the shell:
from pets.models import Pet, PetImage

# Check pets with Cloudinary URLs
pets_with_cloudinary = Pet.objects.filter(cloudinary_url__isnull=False)
for pet in pets_with_cloudinary:
    print(f"Pet ID: {pet.id}, Name: {pet.name}")
    print(f"Cloudinary URL: {pet.cloudinary_url}")
    print(f"Public ID: {pet.cloudinary_public_id}")
    print("---")

# Check additional images
images_with_cloudinary = PetImage.objects.filter(cloudinary_url__isnull=False)
for img in images_with_cloudinary:
    print(f"Image ID: {img.id}, Pet: {img.pet.name}")
    print(f"Cloudinary URL: {img.cloudinary_url}")
    print("---")
```

### Method 4: API Response
When you call the API endpoint:
- `GET /api/pets/` - List all pets
- `GET /api/pets/{id}/` - Get specific pet

The response will include:
```json
{
  "id": 1,
  "name": "Fluffy",
  "cloudinary_url": "https://res.cloudinary.com/drp2hx5d6/image/upload/v1234567890/petadoption/pets/pet_1_main.jpg",
  "cloudinary_public_id": "petadoption/pets/pet_1_main",
  "image_url": "https://res.cloudinary.com/drp2hx5d6/image/upload/v1234567890/petadoption/pets/pet_1_main.jpg",
  ...
}
```

**Note**: The `image_url` field in the API response will show the Cloudinary URL if available (it prioritizes Cloudinary URLs over local images).

## Quick Check Script

Create a file `check_cloudinary_urls.py` in the backend directory:

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pets.models import Pet, PetImage

print("=" * 60)
print("Pets with Cloudinary URLs:")
print("=" * 60)
pets = Pet.objects.filter(cloudinary_url__isnull=False)
if pets.exists():
    for pet in pets:
        print(f"\nPet ID: {pet.id}")
        print(f"Name: {pet.name}")
        print(f"Cloudinary URL: {pet.cloudinary_url}")
        print(f"Public ID: {pet.cloudinary_public_id}")
else:
    print("No pets with Cloudinary URLs found.")

print("\n" + "=" * 60)
print("Pet Images with Cloudinary URLs:")
print("=" * 60)
images = PetImage.objects.filter(cloudinary_url__isnull=False)
if images.exists():
    for img in images:
        print(f"\nImage ID: {img.id}")
        print(f"Pet: {img.pet.name} (ID: {img.pet.id})")
        print(f"Cloudinary URL: {img.cloudinary_url}")
        print(f"Public ID: {img.cloudinary_public_id}")
else:
    print("No additional images with Cloudinary URLs found.")
```

Run it with:
```bash
C:\Users\HP\Desktop\PK\petadoption\petadoption\Scripts\python.exe check_cloudinary_urls.py
```

## What to Look For

- **cloudinary_url**: Full HTTPS URL starting with `https://res.cloudinary.com/`
- **cloudinary_public_id**: Path like `petadoption/pets/pet_{id}_main`
- If these fields are `NULL`, the image hasn't been uploaded to Cloudinary yet (might be an old pet or upload failed)

## Troubleshooting

If `cloudinary_url` is NULL:
1. Check if the pet was created after Cloudinary integration
2. Check server logs for Cloudinary upload errors
3. Verify Cloudinary credentials in settings.py
4. Check if the image file was provided during pet creation

