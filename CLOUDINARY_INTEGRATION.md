# Cloudinary Integration for Pet Adoption Platform

## Overview
This document describes the Cloudinary integration implemented to store pet images in the cloud, reducing latency and improving image delivery performance.

## Changes Made

### 1. Dependencies
- Added `cloudinary>=1.36.0` to `backend/requirements.txt`

### 2. Cloudinary Configuration
- **File**: `backend/backend/settings.py`
- Added Cloudinary configuration variables:
  - `CLOUDINARY_CLOUD_NAME`: drp2hx5d6
  - `CLOUDINARY_API_KEY`: 392655696679497
  - `CLOUDINARY_API_SECRET`: gytzkjH084pi1cXoKBc98PbelUU
  - `CLOUDINARY_URL`: cloudinary://392655696679497:gytzkjH084pi1cXoKBc98PbelUU@drp2hx5d6

### 3. Cloudinary Utility Functions
- **File**: `backend/pets/cloudinary_utils.py`
- Functions:
  - `configure_cloudinary()`: Configures Cloudinary with credentials
  - `upload_image_to_cloudinary()`: Uploads images to Cloudinary
  - `delete_image_from_cloudinary()`: Deletes images from Cloudinary
  - `get_cloudinary_url()`: Generates Cloudinary URLs with transformations

### 4. Database Models Updated
- **File**: `backend/pets/models.py`
- **Pet Model**: Added fields:
  - `cloudinary_url`: URLField to store Cloudinary image URL
  - `cloudinary_public_id`: CharField to store Cloudinary public_id
- **PetImage Model**: Added fields:
  - `cloudinary_url`: URLField to store Cloudinary image URL
  - `cloudinary_public_id`: CharField to store Cloudinary public_id

### 5. Serializers Updated
- **File**: `backend/pets/serializers.py`
- Updated `PetSerializer` and `PetListSerializer`:
  - Added `cloudinary_url` and `cloudinary_public_id` to fields
  - Modified `get_image_url()` to prioritize Cloudinary URLs over local images
  - Updated `get_photos()` to use Cloudinary URLs for PetImage objects
- Updated `PetImageSerializer`:
  - Added `cloudinary_url` and `cloudinary_public_id` to fields
  - Modified `get_image_url()` to prioritize Cloudinary URLs

### 6. Views Updated
- **File**: `backend/pets/views.py`
- Updated `perform_create()` methods in:
  - `PetListView`
  - `LostPetListView`
  - `FoundPetListView`
- All now upload images to Cloudinary when a pet is created
- Images are stored in folder: `petadoption/pets`
- Public ID format: `pet_{pet_id}_main`

## How It Works

1. **Image Upload Flow**:
   - When a pet is created with an image, the image is uploaded to Cloudinary
   - Cloudinary returns a secure URL and public_id
   - These are stored in the database alongside the local image reference
   - The local image is still saved for backward compatibility

2. **Image Retrieval Flow**:
   - Serializers prioritize Cloudinary URLs over local images
   - If `cloudinary_url` exists, it's returned
   - Otherwise, falls back to local image URL construction
   - This ensures backward compatibility with existing data

3. **Benefits**:
   - Reduced server load (images served from CDN)
   - Faster image delivery (Cloudinary CDN)
   - Automatic image optimization
   - Better scalability
   - Reduced database storage needs

## Migration Instructions

After deploying these changes, run:

```bash
cd backend
python manage.py makemigrations pets
python manage.py migrate pets
```

This will create the new `cloudinary_url` and `cloudinary_public_id` fields in the database.

## Environment Variables

Make sure to set these environment variables (or they'll use the defaults):

```bash
CLOUDINARY_CLOUD_NAME=drp2hx5d6
CLOUDINARY_API_KEY=392655696679497
CLOUDINARY_API_SECRET=gytzkjH084pi1cXoKBc98PbelUU
CLOUDINARY_URL=cloudinary://392655696679497:gytzkjH084pi1cXoKBc98PbelUU@drp2hx5d6
```

## Testing

1. Create a new pet with an image
2. Check the database - `cloudinary_url` and `cloudinary_public_id` should be populated
3. Verify the image URL in the API response uses Cloudinary URL
4. Check Cloudinary dashboard to see uploaded images in `petadoption/pets` folder

## Future Enhancements

- Add support for multiple image uploads to Cloudinary
- Implement image transformations (resize, crop, etc.)
- Add image deletion from Cloudinary when pets are deleted
- Implement batch upload for existing images

