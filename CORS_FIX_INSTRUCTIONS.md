# CORS Fix Instructions - Vercel Frontend + Render Backend

## Problem
Your frontend on Vercel (`https://petadoption-amber.vercel.app`) cannot connect to your backend on Render (`https://petadoption-v2q3.onrender.com`) due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution

### Step 1: Update Backend CORS Settings on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click on your backend service: `petadoption-backend`

2. **Go to Environment Tab**
   - Click on "Environment" in the left sidebar

3. **Add/Update Environment Variable**
   - **Key:** `CORS_ALLOWED_ORIGINS`
   - **Value:** `https://petadoption-amber.vercel.app`
   - Click "Save Changes"

   **OR** if you want to allow multiple origins (comma-separated):
   ```
   https://petadoption-amber.vercel.app,https://petadoption-frontend.onrender.com
   ```

4. **Redeploy Backend**
   - Go to "Events" tab
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete (2-3 minutes)

### Step 2: Verify Frontend Environment Variable (Optional but Recommended)

Even though the frontend code has the backend URL as default, it's better to set it explicitly in Vercel:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your project: `petadoption-amber` (or your project name)

2. **Go to Settings → Environment Variables**
   - Click "Settings" tab
   - Click "Environment Variables" in the left sidebar

3. **Add Environment Variable**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com/api`
   - **Environment:** Production, Preview, Development (select all)
   - Click "Save"

4. **Redeploy Frontend**
   - Go to "Deployments" tab
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - Or just push a new commit to trigger auto-deploy

## What Changed in Code

The backend `settings.py` now:
- ✅ Automatically includes `https://petadoption-amber.vercel.app` in allowed origins
- ✅ Reads `CORS_ALLOWED_ORIGINS` from environment variable
- ✅ Supports multiple origins (comma-separated)

## Testing

After redeploying the backend:

1. Open your frontend: `https://petadoption-amber.vercel.app`
2. Open browser DevTools (F12) → Console tab
3. Try to login or make any API request
4. You should **NOT** see CORS errors anymore

## If Still Not Working

1. **Clear browser cache** and try again
2. **Check backend logs** on Render to see if requests are coming through
3. **Verify the CORS environment variable** is set correctly (no trailing slashes)
4. **Check that backend is fully deployed** (not still building)

## Quick Checklist

- [ ] Added `CORS_ALLOWED_ORIGINS` environment variable in Render backend
- [ ] Redeployed backend service
- [ ] (Optional) Added `VITE_API_URL` in Vercel frontend
- [ ] (Optional) Redeployed frontend
- [ ] Tested login/API calls - no CORS errors

## Alternative: Allow All Origins (NOT Recommended for Production)

If you want to allow all origins (less secure, but easier for testing):

In Render backend environment variables:
- **Key:** `CORS_ALLOW_ALL_ORIGINS`
- **Value:** `true`

Then update `settings.py` to check this variable. But this is **NOT recommended** for production!

---

**After following these steps, your frontend should be able to communicate with your backend!** 🎉

