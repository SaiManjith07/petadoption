# CORS Error Fix for Vercel Frontend

## Problem
The frontend deployed on Vercel (`https://petadoption-amber.vercel.app`) cannot access the backend API on Render (`https://petadoption-v2q3.onrender.com`) due to CORS policy blocking.

## Solution Applied

### 1. Updated CORS Settings in `backend/backend/settings.py`

The CORS configuration has been updated to:
- ✅ Include `https://petadoption-amber.vercel.app` in allowed origins
- ✅ Add regex pattern to allow all `*.vercel.app` domains (for preview deployments)
- ✅ Add regex pattern to allow all `*.onrender.com` domains

### 2. Required Actions

#### Step 1: Add Environment Variable in Render (Optional but Recommended)

1. Go to your Render Dashboard
2. Select your **Backend Service** (Django)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key**: `CORS_ALLOWED_ORIGINS`
   - **Value**: `https://petadoption-amber.vercel.app`
   - Click **Save Changes**

#### Step 2: Enable Debug CORS (Temporary, for troubleshooting)

1. Add another environment variable:
   - **Key**: `DEBUG_CORS`
   - **Value**: `true`
   - This will print allowed CORS origins in the logs

#### Step 3: Redeploy Backend

After adding/changing environment variables:
1. **Redeploy** your Render service
   - Either push changes to GitHub (if auto-deploy is enabled)
   - Or manually trigger a deploy from Render dashboard

#### Step 4: Verify CORS is Working

After redeployment:
1. Check Render logs for: `[CORS] Allowed Origins: ...`
2. Try logging in from Vercel frontend
3. Check browser console - CORS error should be gone

## Current CORS Configuration

The backend now allows:
- ✅ `https://petadoption-amber.vercel.app` (exact match)
- ✅ Any `*.vercel.app` domain (regex pattern)
- ✅ Any `*.onrender.com` domain (regex pattern)
- ✅ Localhost origins (for development)

## If CORS Error Persists

1. **Check Render Logs**: Look for CORS-related errors or the debug output
2. **Verify Environment Variables**: Make sure `CORS_ALLOWED_ORIGINS` is set correctly
3. **Check Middleware Order**: CORS middleware should be before other middleware (already configured)
4. **Clear Browser Cache**: Sometimes cached CORS errors persist
5. **Check Network Tab**: Verify the `Access-Control-Allow-Origin` header is present in the response

## Testing

After redeployment, test from:
- ✅ Vercel production: `https://petadoption-amber.vercel.app`
- ✅ Vercel preview deployments (should work automatically via regex)
- ✅ Local development: `http://localhost:5173` or `http://localhost:3000`

## Notes

- The code changes are already in place
- You just need to redeploy the backend on Render
- The CORS settings will work automatically, but adding the environment variable is recommended for explicit control

