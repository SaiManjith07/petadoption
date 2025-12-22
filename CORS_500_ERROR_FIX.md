# CORS and 500 Error Troubleshooting

## Current Issue
- **CORS Error**: No 'Access-Control-Allow-Origin' header present
- **500 Internal Server Error**: Backend is crashing before sending CORS headers

## Root Cause
The 500 error is preventing CORS headers from being sent. When Django encounters a server error, it may not process the CORS middleware properly.

## CORS Configuration Status
✅ CORS settings are correctly configured in `backend/backend/settings.py`:
- `https://petadoption-amber.vercel.app` is in allowed origins
- Regex patterns allow all `*.vercel.app` domains
- CORS middleware is properly positioned

## Steps to Fix

### Step 1: Check Render Logs for 500 Error
1. Go to Render Dashboard
2. Select your Backend Service
3. Go to **Logs** tab
4. Look for the actual error causing the 500
5. Common causes:
   - Missing environment variables
   - Database connection issues
   - Import errors
   - Missing dependencies

### Step 2: Verify Backend Deployment
1. Check if the latest code with CORS fixes is deployed
2. If not, trigger a manual redeploy from Render dashboard
3. Wait for deployment to complete

### Step 3: Add Environment Variable (Recommended)
In Render Dashboard → Environment tab, add:
- **Key**: `CORS_ALLOWED_ORIGINS`
- **Value**: `https://petadoption-amber.vercel.app`
- **Key**: `DEBUG_CORS`
- **Value**: `true` (temporary, for debugging)

### Step 4: Check Backend Health
Test the backend directly:
```bash
curl https://petadoption-v2q3.onrender.com/api/auth/login/ -X OPTIONS -H "Origin: https://petadoption-amber.vercel.app" -v
```

This should return CORS headers even if the endpoint requires authentication.

### Step 5: Verify CORS Headers
After fixing the 500 error, check if CORS headers are present:
- `Access-Control-Allow-Origin: https://petadoption-amber.vercel.app`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS, ...`
- `Access-Control-Allow-Headers: ...`

## Common 500 Error Causes

1. **Missing Environment Variables**
   - Check if all required env vars are set in Render
   - Especially: `DATABASE_URL`, `SECRET_KEY`, `CLOUDINARY_*`

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check if Neon database is accessible

3. **Missing Dependencies**
   - Ensure `cloudinary` is installed
   - Check `requirements.txt` is up to date

4. **Import Errors**
   - Check if all imports in `settings.py` are valid
   - Verify middleware imports

## Quick Fix: Enable CORS Debugging

Add to Render environment variables:
- `DEBUG_CORS=true`

This will print CORS configuration in logs, helping identify the issue.

## After Fixing 500 Error

Once the 500 error is resolved:
1. CORS headers should be sent automatically
2. Frontend should be able to make requests
3. Remove `DEBUG_CORS=true` after verification

## Testing

After deployment, test from browser console:
```javascript
fetch('https://petadoption-v2q3.onrender.com/api/auth/login/', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://petadoption-amber.vercel.app'
  }
}).then(r => console.log(r.headers.get('Access-Control-Allow-Origin')))
```

This should return: `https://petadoption-amber.vercel.app`

