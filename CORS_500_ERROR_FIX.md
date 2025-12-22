# CORS and 500 Error Fix Guide

## Problem
The deployed server is experiencing CORS errors when requests are made from `https://petadoption-amber.vercel.app` to `https://petadoption-v2q3.onrender.com/api/auth/login/`. The error shows:
- `No 'Access-Control-Allow-Origin' header is present on the requested resource`
- `500 (Internal Server Error)`

## Root Cause
The 500 Internal Server Error is likely preventing CORS headers from being sent. When an exception occurs before CORS headers are added, the browser blocks the response.

## Solution Implemented

### 1. Enhanced CORSExceptionMiddleware
- **Location**: `backend/backend/middleware.py`
- **Improvements**:
  - Wrapped entire request/response cycle in try-except block
  - Catches all exceptions and ensures CORS headers are added to error responses
  - Added detailed error logging for debugging
  - Handles missing origin headers with fallback logic
  - Returns JSON error responses with proper CORS headers

### 2. CORS Configuration
- **Location**: `backend/backend/settings.py`
- **Current Settings**:
  - `CORS_ALLOWED_ORIGINS` includes `https://petadoption-amber.vercel.app`
  - `CORS_ALLOWED_ORIGIN_REGEXES` includes `^https://.*\.vercel\.app$` and `^https://.*\.onrender\.com$`
  - `CORS_ALLOW_CREDENTIALS = True`
  - Comprehensive `CORS_ALLOW_METHODS` and `CORS_ALLOW_HEADERS`

### 3. Middleware Order
The middleware is correctly ordered:
1. `SecurityMiddleware`
2. `CorsMiddleware` (django-cors-headers)
3. `RenderHostMiddleware` (custom - allows .onrender.com domains)
4. `CORSExceptionMiddleware` (custom - ensures CORS headers on errors)
5. Other Django middleware...

## Next Steps for Render Deployment

### 1. Check Render Logs
After deploying, check the Render logs to see:
- What specific error is causing the 500 response
- Whether CORS headers are being added (check for `[CORSExceptionMiddleware]` log messages)
- Any database connection issues
- Any missing environment variables

### 2. Verify Environment Variables on Render
Ensure these are set in Render dashboard:
- `CORS_ALLOWED_ORIGINS` (optional - should include Vercel URL)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DATABASE_URL`
- `SECRET_KEY`
- `DEBUG=False` (for production)
- `ALLOWED_HOSTS` (should include your Render domain)

### 3. Test the Fix
1. Deploy the updated code to Render
2. Check Render logs for any startup errors
3. Try logging in from the Vercel frontend
4. Check browser console for CORS errors
5. Check Render logs for the `[CORSExceptionMiddleware]` messages

### 4. If 500 Error Persists
The 500 error might be caused by:
- Database connection issues (check `DATABASE_URL`)
- Missing environment variables
- Import errors in Python code
- Cloudinary configuration issues

Check Render logs to identify the specific error and fix it accordingly.

## Testing Locally
To test CORS locally:
1. Start Django server: `python manage.py runserver`
2. Start frontend: `npm run dev` (or your frontend command)
3. Try logging in
4. Check Django console for CORS logs

## Additional Notes
- The middleware now logs all exceptions with full tracebacks
- CORS headers are added even when exceptions occur
- Error responses are returned as JSON with proper CORS headers
- The middleware handles both view exceptions and middleware exceptions
