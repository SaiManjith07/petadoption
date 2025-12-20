# Fix Uploaded Images Not Showing After Deployment

## Problem
After deploying to Render, uploaded images are not showing because:
1. **Render's filesystem is ephemeral** - Files get deleted when the service restarts
2. **Media files only served in DEBUG mode** - Production doesn't serve media files by default
3. **BACKEND_URL is hardcoded** - Image URLs point to localhost instead of Render URL

## Solution Options

### Option 1: Enable Media Serving (Quick Fix - Temporary)
This works but files will be lost on restart. Good for testing.

**In Render Dashboard:**
1. Go to your backend service → **Environment** tab
2. Add environment variable:
   - **Key:** `SERVE_MEDIA`
   - **Value:** `true`
3. Add environment variable:
   - **Key:** `BACKEND_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com`
4. **Redeploy** the backend

**Limitation:** Files will be lost when Render restarts your service.

---

### Option 2: Use Cloud Storage (Recommended for Production)

Use AWS S3, Cloudinary, or similar service for persistent storage.

#### Using Cloudinary (Easiest - Free Tier Available)

1. **Sign up for Cloudinary:**
   - Visit: https://cloudinary.com
   - Create free account
   - Get your credentials from dashboard

2. **Install Cloudinary:**
   ```bash
   pip install cloudinary django-cloudinary-storage
   ```

3. **Update settings.py:**
   ```python
   INSTALLED_APPS = [
       # ... existing apps ...
       'cloudinary',
       'cloudinary_storage',
   ]
   
   # Cloudinary settings
   CLOUDINARY_STORAGE = {
       'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
       'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
       'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
   }
   
   DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
   ```

4. **Add to Render Environment Variables:**
   - `CLOUDINARY_CLOUD_NAME` = (from Cloudinary dashboard)
   - `CLOUDINARY_API_KEY` = (from Cloudinary dashboard)
   - `CLOUDINARY_API_SECRET` = (from Cloudinary dashboard)

5. **Update requirements.txt:**
   ```
   cloudinary>=1.36.0
   django-cloudinary-storage>=0.3.0
   ```

#### Using AWS S3

1. **Create S3 bucket** on AWS
2. **Install boto3 and django-storages:**
   ```bash
   pip install boto3 django-storages
   ```
3. **Update settings.py** with S3 configuration
4. **Add AWS credentials** to Render environment variables

---

### Option 3: Use Render Persistent Disk (Render Pro Plan)

If you're on Render Pro plan, you can use persistent disk storage.

---

## Quick Fix Steps (Option 1 - Temporary)

### Step 1: Update Render Environment Variables

1. Go to **Render Dashboard** → Your backend service
2. Go to **Environment** tab
3. Add these environment variables:

   **Variable 1:**
   - **Key:** `SERVE_MEDIA`
   - **Value:** `true`

   **Variable 2:**
   - **Key:** `BACKEND_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com`

4. Click **"Save Changes"**

### Step 2: Redeploy Backend

1. Go to **Events** tab
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment to complete

### Step 3: Test

1. Upload a new image
2. Check if it displays correctly
3. **Note:** Images will be lost if Render restarts your service

---

## What Changed in Code

✅ **backend/backend/urls.py:**
- Now serves media files in production when `SERVE_MEDIA=true`
- Added import for `os`

✅ **backend/backend/settings.py:**
- `BACKEND_URL` now reads from environment variable
- Falls back to `RENDER_EXTERNAL_URL` (auto-set by Render)
- Defaults to localhost for local development

---

## Recommended: Set Up Cloud Storage

For production, **strongly recommend** using cloud storage (Cloudinary is easiest):
- ✅ Files persist across restarts
- ✅ Better performance (CDN)
- ✅ Scalable
- ✅ Free tier available

See Option 2 above for Cloudinary setup instructions.

---

## Troubleshooting

### Images still not showing?
1. Check `BACKEND_URL` is set correctly in Render
2. Check `SERVE_MEDIA=true` is set
3. Verify backend is redeployed
4. Check browser console for 404 errors on image URLs
5. Verify image URLs in API responses include full backend URL

### Images show but disappear after restart?
- This is expected with Option 1 (ephemeral storage)
- **Solution:** Use cloud storage (Option 2)

---

## Summary

**Quick Fix (Temporary):**
1. Render → Environment → Add `SERVE_MEDIA=true`
2. Render → Environment → Add `BACKEND_URL=https://petadoption-v2q3.onrender.com`
3. Redeploy backend

**Production Solution:**
- Set up Cloudinary or AWS S3 for persistent storage

