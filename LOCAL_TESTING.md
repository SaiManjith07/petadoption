# Local Testing Guide

## Quick Setup

### 1. Start Django Backend Server

```bash
cd backend
# Activate virtual environment (if using one)
# Windows:
.\petadoption\Scripts\activate
# Or use full path:
C:\Users\HP\Desktop\PK\petadoption\petadoption\Scripts\python.exe manage.py runserver 8000
```

The server will start at: `http://localhost:8000`

### 2. Start Frontend Development Server

```bash
cd Frontend
npm run dev
# or
npm start
```

The frontend will typically start at: `http://localhost:5173` or `http://localhost:8080`

## API Configuration

The frontend automatically detects if you're running locally and switches to:
- **Local API**: `http://localhost:8000/api`
- **Render API**: `https://petadoption-v2q3.onrender.com/api` (production)

### Manual Override

You can override the API URL by setting environment variables:

Create a `.env.local` file in the `Frontend` directory:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

Or for Render:
```env
VITE_API_URL=https://petadoption-v2q3.onrender.com/api
VITE_WS_URL=wss://petadoption-v2q3.onrender.com/ws
```

## Testing Cloudinary Endpoints Locally

### 1. Test Configuration Endpoint

**URL**: `http://localhost:8000/api/pets/test/cloudinary/config/`

**Method**: GET

**Headers**:
```
Authorization: Bearer <your_access_token>
```

**Expected Response**:
```json
{
  "success": true,
  "config": {
    "cloud_name": "drp2hx5d6",
    "api_key": "392655696679497",
    "api_secret_set": true,
    "configured": true
  },
  "message": "Cloudinary is configured"
}
```

### 2. Test Upload Endpoint

**URL**: `http://localhost:8000/api/pets/test/cloudinary/upload/`

**Method**: POST

**Headers**:
```
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data
```

**Body**: Form data with `image` field

**Expected Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully to Cloudinary",
  "cloudinary_url": "https://res.cloudinary.com/...",
  "public_id": "petadoption/test/test_1_image.jpg",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "size_bytes": 245678
}
```

### 3. Test Pets with Cloudinary URLs

**URL**: `http://localhost:8000/api/pets/test/cloudinary/pets/`

**Method**: GET

**Headers**:
```
Authorization: Bearer <your_access_token>
```

**Expected Response**:
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

## Using the Cloudinary Test Page

1. Start both backend and frontend servers
2. Login as admin user
3. Navigate to: `http://localhost:8080/admin/cloudinary-test`
4. Or click "Cloudinary Test" in the admin sidebar

## Testing with cURL

### Test Configuration
```bash
curl -X GET "http://localhost:8000/api/pets/test/cloudinary/config/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Upload
```bash
curl -X POST "http://localhost:8000/api/pets/test/cloudinary/upload/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### Test Pets Data
```bash
curl -X GET "http://localhost:8000/api/pets/test/cloudinary/pets/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure:
- Backend CORS settings include your frontend URL (e.g., `http://localhost:8080`)
- You're using the correct port

### 404 Errors
- Verify the Django server is running on port 8000
- Check that the URL pattern matches: `/api/pets/test/cloudinary/config/`
- Ensure you've run migrations: `python manage.py migrate`

### Authentication Errors
- Make sure you're logged in and have a valid access token
- Check that the token is included in the Authorization header
- Verify the user has admin permissions (for some endpoints)

### Cloudinary Errors
- Verify Cloudinary credentials are set in environment variables or `settings.py`
- Check that the `cloudinary` package is installed: `pip install cloudinary`
- Ensure you have internet connection (Cloudinary requires API access)

## Switching Between Local and Render

The frontend automatically detects the environment:
- **localhost** → Uses `http://localhost:8000/api`
- **Production** → Uses `https://petadoption-v2q3.onrender.com/api`

To force a specific URL, set the `VITE_API_URL` environment variable.

