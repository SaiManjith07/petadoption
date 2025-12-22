# Render Environment Variables

## Required Environment Variables for Cloudinary Integration

To deploy the Cloudinary integration on Render, you need to add the following environment variables in your Render dashboard:

### Cloudinary Configuration

1. **CLOUDINARY_CLOUD_NAME**
   - Value: `drp2hx5d6`
   - Description: Your Cloudinary cloud name

2. **CLOUDINARY_API_KEY**
   - Value: `392655696679497`
   - Description: Your Cloudinary API key

3. **CLOUDINARY_API_SECRET**
   - Value: `gytzkjH084pi1cXoKBc98PbelUU`
   - Description: Your Cloudinary API secret (keep this secure!)

### Optional (Has Defaults)

These variables have defaults in the code, but it's recommended to set them explicitly:

- **CLOUDINARY_URL** (optional)
  - Value: `cloudinary://392655696679497:gytzkjH084pi1cXoKBc98PbelUU@drp2hx5d6`
  - Description: Full Cloudinary URL (alternative to individual credentials)

## How to Add Environment Variables in Render

1. Go to your Render Dashboard
2. Select your **Backend Service** (Django)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable:
   - **Key**: `CLOUDINARY_CLOUD_NAME`
   - **Value**: `drp2hx5d6`
   - Click **Save Changes**
6. Repeat for `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`

## After Adding Variables

1. **Redeploy** your service (Render will auto-deploy after you push to GitHub)
2. Or manually trigger a deploy from the Render dashboard

## Verification

After deployment, you can verify Cloudinary is working by:

1. Login as admin
2. Navigate to `/admin/cloudinary-test`
3. Click "Check Configuration" - should show Cloudinary is configured
4. Upload a test image - should upload successfully to Cloudinary

## Security Note

⚠️ **Important**: The API secret is sensitive. Make sure:
- It's only set in Render's environment variables (not in code)
- It's not committed to Git
- Only authorized team members have access to Render dashboard

## Current Status

✅ The code has default values for development, but for production on Render, you should set these environment variables explicitly for better security and configuration management.

