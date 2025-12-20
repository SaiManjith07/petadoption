# Fix CORS Issues in Render - Step by Step Guide

## Problem
Your frontend on Vercel (`https://petadoption-amber.vercel.app`) cannot connect to your backend on Render due to CORS errors.

## Solution: Update Render Backend Settings

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Sign in to your account

### Step 2: Open Your Backend Service
1. Click on your backend service: **`petadoption-backend`** (or whatever you named it)

### Step 3: Go to Environment Tab
1. Click on **"Environment"** in the left sidebar
2. You'll see a list of environment variables

### Step 4: Add/Update CORS Environment Variable
1. Look for an environment variable named: **`CORS_ALLOWED_ORIGINS`**
   - **If it exists:** Click on it and edit the value
   - **If it doesn't exist:** Click **"Add Environment Variable"** button

2. Set the following:
   - **Key:** `CORS_ALLOWED_ORIGINS`
   - **Value:** `https://petadoption-amber.vercel.app`
   
   **OR** if you want to allow multiple origins (comma-separated):
   ```
   https://petadoption-amber.vercel.app,https://petadoption-frontend.onrender.com
   ```

3. Click **"Save Changes"**

### Step 5: Enable CORS Debug (Optional but Recommended)
1. Add another environment variable:
   - **Key:** `DEBUG_CORS`
   - **Value:** `true`
2. Click **"Save Changes"**

This will help you see in the logs which origins are being allowed.

### Step 6: Verify Other Important Environment Variables
Make sure these are set correctly:
- ✅ `DJANGO_SETTINGS_MODULE` = `backend.settings`
- ✅ `DEBUG` = `False` (for production)
- ✅ `DATABASE_URL` = (your database connection string)
- ✅ `SECRET_KEY` = (your secret key)
- ✅ `ALLOWED_HOSTS` = (can be auto-generated or set manually)

### Step 7: Redeploy Backend
1. Go to **"Events"** tab (in the left sidebar)
2. Click **"Manual Deploy"** button
3. Select **"Deploy latest commit"**
4. Wait 2-3 minutes for deployment to complete

### Step 8: Check Deployment Logs
1. Go to **"Logs"** tab
2. Look for:
   - `[CORS] Allowed Origins: [...]` (if DEBUG_CORS is enabled)
   - `Listening on TCP address` or `Application startup complete`
   - No CORS-related errors

### Step 9: Test Your Frontend
1. Open your frontend: `https://petadoption-amber.vercel.app`
2. Open browser DevTools (F12) → Console tab
3. Try to login or make any API request
4. **CORS errors should be gone!** ✅

---

## If Still Not Working

### Check 1: Verify Backend is Running
- Go to Render → Your backend → Logs
- Make sure you see: "Listening on TCP address" or "Application startup complete"
- If not, check for errors in the logs

### Check 2: Verify CORS Origins in Logs
- If `DEBUG_CORS=true` is set, check logs for: `[CORS] Allowed Origins:`
- Make sure `https://petadoption-amber.vercel.app` is in the list

### Check 3: Clear Browser Cache
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Clear cache and cookies
- Try again in incognito/private window

### Check 4: Verify Environment Variables
- Make sure `CORS_ALLOWED_ORIGINS` has no trailing spaces
- Make sure the URL is exactly: `https://petadoption-amber.vercel.app` (no trailing slash)

### Check 5: Check Backend Response Headers
- In browser DevTools → Network tab
- Click on a failed request
- Check "Response Headers"
- Look for `Access-Control-Allow-Origin` header
- It should show: `https://petadoption-amber.vercel.app`

---

## Quick Checklist

- [ ] Added `CORS_ALLOWED_ORIGINS` environment variable in Render
- [ ] Value is exactly: `https://petadoption-amber.vercel.app` (no typos, no trailing slash)
- [ ] (Optional) Added `DEBUG_CORS=true` for debugging
- [ ] Saved all environment variable changes
- [ ] Manually redeployed backend service
- [ ] Waited for deployment to complete (2-3 minutes)
- [ ] Checked logs for successful startup
- [ ] Tested frontend - no CORS errors

---

## Summary

**What to modify in Render:**
1. **Environment Tab** → Add `CORS_ALLOWED_ORIGINS` = `https://petadoption-amber.vercel.app`
2. **Events Tab** → Click "Manual Deploy" → "Deploy latest commit"

**That's it!** After redeployment, CORS should work! 🎉

