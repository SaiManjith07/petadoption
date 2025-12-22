# Cloudinary Test Page

## Overview
A dedicated test page has been created to verify Cloudinary image uploads before full integration into the website.

## Access the Test Page

### URL
```
http://localhost:8080/admin/cloudinary-test
```

### Navigation
1. Login as admin
2. Go to Admin Dashboard
3. Click "Cloudinary Test" in the sidebar menu

## Features

### 1. Configuration Check
- **Button**: "Check Configuration"
- **Purpose**: Verifies Cloudinary credentials are properly configured
- **Shows**: Cloud name, API key, and whether API secret is set

### 2. Test Image Upload
- **Purpose**: Upload a test image directly to Cloudinary
- **Features**:
  - File selector for image upload
  - Upload button to test Cloudinary upload
  - Shows upload result with:
    - Cloudinary URL
    - Public ID
    - Image format
    - Dimensions (width x height)
    - File size
    - Image preview

### 3. Pets with Cloudinary URLs
- **Purpose**: View all pets that have Cloudinary URLs stored in the database
- **Features**:
  - Statistics dashboard showing:
    - Total pets
    - Pets with Cloudinary URLs
    - Pets without Cloudinary URLs
    - Total additional images
    - Images with Cloudinary URLs
    - Images without Cloudinary URLs
  - List of all pets with Cloudinary URLs
  - List of all additional images with Cloudinary URLs
  - Image previews for each entry

## Backend API Endpoints

### 1. Test Upload
```
POST /api/pets/test/cloudinary/upload/
Content-Type: multipart/form-data
Body: { image: File }
```

**Response**:
```json
{
  "success": true,
  "cloudinary_url": "https://res.cloudinary.com/...",
  "public_id": "petadoption/test/test_1_image.jpg",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "size_bytes": 245678
}
```

### 2. Check Configuration
```
GET /api/pets/test/cloudinary/config/
```

**Response**:
```json
{
  "success": true,
  "config": {
    "cloud_name": "drp2hx5d6",
    "api_key": "392655696679497",
    "api_secret_set": true,
    "configured": true
  }
}
```

### 3. Get Pets with Cloudinary URLs
```
GET /api/pets/test/cloudinary/pets/
```

**Response**:
```json
{
  "success": true,
  "statistics": {
    "total_pets": 50,
    "pets_with_cloudinary": 10,
    "pets_without_cloudinary": 40,
    "total_additional_images": 25,
    "images_with_cloudinary": 5,
    "images_without_cloudinary": 20
  },
  "pets_with_cloudinary": [...],
  "images_with_cloudinary": [...]
}
```

## How to Use

### Step 1: Check Configuration
1. Click "Check Configuration" button
2. Verify that Cloudinary is configured correctly
3. Check that API secret is set

### Step 2: Test Upload
1. Click "Choose File" and select an image
2. Click "Upload to Cloudinary"
3. Wait for upload to complete
4. Verify:
   - Success message appears
   - Cloudinary URL is displayed
   - Image preview shows correctly
   - URL is clickable and opens in new tab

### Step 3: Check Database
1. Click "Load Pets Data" button
2. Review statistics:
   - How many pets have Cloudinary URLs
   - How many don't
3. View list of pets with Cloudinary URLs
4. Verify images are displaying correctly

## Troubleshooting

### Upload Fails
- Check backend console for error messages
- Verify Cloudinary credentials in settings.py
- Check network tab in browser for API errors
- Ensure image file is valid (jpg, png, etc.)

### No Pets Showing
- This is normal if no pets have been created yet
- Create a pet with an image through the normal flow
- Then check this page again

### Configuration Error
- Verify environment variables are set:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Check backend console for detailed error messages

## Integration Status

Once you verify that:
1. ✅ Configuration is correct
2. ✅ Test uploads work
3. ✅ Images appear in Cloudinary dashboard
4. ✅ URLs are stored in database

Then the Cloudinary integration is ready for production use. The test page can remain available for ongoing monitoring and debugging.

## Files Created

### Backend
- `backend/pets/test_cloudinary_views.py` - Test API endpoints
- `backend/pets/urls.py` - Updated with test routes

### Frontend
- `Frontend/src/pages/admin/CloudinaryTest.tsx` - Test page component
- `Frontend/src/App.tsx` - Added route
- `Frontend/src/components/layout/AdminSidebar.tsx` - Added menu item

