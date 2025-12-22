# CORS and 500 Error Fix Guide

## ⚠️ Problem
You're experiencing two related issues:
1. **CORS Error**: `No 'Access-Control-Allow-Origin' header is present`
2. **500 Internal Server Error**: The login endpoint is returning a 500 error

**The 500 error is preventing CORS headers from being sent**, which causes the CORS error. **Fix the 500 error first!**

## Root Cause
When Django throws a 500 error, the CORS middleware might not get a chance to add headers to the response, especially if the error occurs before the response is fully formed.

## Solution Applied

### 1. Added CORS Exception Middleware
Created `backend/backend/middleware.py` with `CORSExceptionMiddleware` that:
- ✅ Catches exceptions and ensures CORS headers are added even on errors
- ✅ Wraps error responses with proper CORS headers
- ✅ Checks allowed origins before adding headers

### 2. Updated Middleware Order
The middleware order in `settings.py` is now:
1. SecurityMiddleware
2. CorsMiddleware (django-cors-headers)
3. RenderHostMiddleware (custom)
4. **CORSExceptionMiddleware (NEW - ensures CORS on errors)**
5. Other middleware...

## Steps to Fix

### Step 1: Check Render Logs for 500 Error
The 500 error needs to be fixed first. Check your Render logs:

1. Go to Render Dashboard
2. Select your **Backend Service**
3. Click on **Logs** tab
4. Look for errors when you try to login
5. Common causes:
   - Missing environment variables
   - Database connection issues
   - Import errors
   - Missing dependencies

### Step 2: Verify Environment Variables in Render
Make sure these are set in Render:

**Required:**
- `DATABASE_URL` - Your Neon database URL
- `SECRET_KEY` - Django secret key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

**Optional but Recommended:**
- `CORS_ALLOWED_ORIGINS` - `https://petadoption-amber.vercel.app`
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Your Render domain (usually auto-detected)

### Step 3: Check Database Connection
The 500 error might be due to database issues:

1. Verify `DATABASE_URL` is correct in Render
2. Check if Neon database is accessible
3. Ensure database migrations are applied:
   ```bash
   python manage.py migrate
   ```

### Step 4: Deploy Updated Code
After making the changes:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix CORS headers on 500 errors"
   git push origin main
   ```

2. **Redeploy on Render:**
   - If auto-deploy is enabled, Render will deploy automatically
   - Or manually trigger a deploy from Render dashboard

### Step 5: Test After Deployment
1. Check Render logs for startup messages
2. Look for: `[CORS] Allowed Origins: ...` in logs
3. Try logging in from Vercel frontend
4. Check browser console - should see CORS headers even on errors

## Debugging the 500 Error

### Common Causes:

1. **Missing Environment Variables**
   - Check Render environment tab
   - Verify all required variables are set

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Neon database status
   - Ensure SSL is enabled

3. **Import Errors**
   - Check if all Python packages are in `requirements.txt`
   - Verify virtual environment is set up correctly

4. **Migration Issues**
   - Run migrations: `python manage.py migrate`
   - Check for pending migrations

5. **Cloudinary Configuration**
   - Verify Cloudinary credentials are correct
   - Check if Cloudinary is accessible

### How to Check Logs:

1. **In Render Dashboard:**
   - Go to your service → Logs tab
   - Look for error tracebacks
   - Check for "Internal Server Error" messages

2. **Common Error Patterns:**
   ```
   ModuleNotFoundError: No module named 'X'
   → Add missing package to requirements.txt
   
   django.db.utils.OperationalError
   → Database connection issue
   
   KeyError: 'X'
   → Missing environment variable
   ```

## Testing CORS Fix

After deployment, test with:

1. **Browser Console:**
   - Open DevTools → Network tab
   - Try to login
   - Check response headers for `Access-Control-Allow-Origin`

2. **Curl Test:**
   ```bash
   curl -H "Origin: https://petadoption-amber.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: content-type" \
        -X OPTIONS \
        https://petadoption-v2q3.onrender.com/api/auth/login/
   ```
   
   Should return headers including `Access-Control-Allow-Origin`

## Next Steps

1. ✅ Code changes are done (CORS middleware added)
2. ⏳ **You need to:**
   - Check Render logs to find the 500 error cause
   - Fix the underlying issue (database, env vars, etc.)
   - Commit and push changes
   - Redeploy on Render
   - Test login again

## Summary

The CORS middleware fix ensures headers are sent even on errors, but you still need to:
1. **Fix the 500 error** (check Render logs)
2. **Deploy the updated code** (commit and push)
3. **Test the login** (should work after 500 is fixed)

The CORS error will disappear once the 500 error is fixed and the new middleware is deployed.
