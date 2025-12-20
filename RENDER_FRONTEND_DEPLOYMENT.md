# Deploy Frontend to Render as Static Site

## Why Static Site (Not Web Service)?

**Static Site** ✅ (Recommended)
- Free tier available
- Perfect for React/Vite apps
- No server needed - just serves static files
- Fast CDN delivery
- Automatic HTTPS

**Web Service** ❌ (Not needed)
- Requires a server running (Node.js)
- More expensive
- Unnecessary for static React apps
- Only needed if you have server-side rendering (SSR)

---

## Step-by-Step Deployment Guide

### Option 1: Using Render Dashboard (Easiest)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in if needed

2. **Create New Static Site**
   - Click "New +" button (top right)
   - Select "Static Site"

3. **Connect Repository**
   - Click "Connect account" if not connected
   - Select your GitHub repository: `SaiManjith07/petadoption`
   - Click "Connect"

4. **Configure Build Settings**
   - **Name:** `petadoption-frontend` (or any name you prefer)
   - **Branch:** `main`
   - **Root Directory:** `Frontend` ⚠️ **IMPORTANT**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

5. **Add Environment Variable**
   - Click "Advanced" → "Add Environment Variable"
   - **Key:** `VITE_API_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com/api`
   - Click "Add"

6. **Deploy**
   - Click "Create Static Site"
   - Render will start building and deploying
   - Wait 3-5 minutes for the build to complete

7. **Get Your URL**
   - Once deployed, you'll get a URL like: `https://petadoption-frontend.onrender.com`
   - The site will auto-update on every push to main branch

---

### Option 2: Using render.yaml (Automatic)

If you want to use the `render.yaml` file:

1. **The render.yaml is already configured** in the root directory
2. **Go to Render Dashboard**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` and create both services automatically

---

## Important Configuration Details

### Root Directory
**Must be set to:** `Frontend`
- This tells Render where your frontend code is located

### Build Command
```
npm install && npm run build
```
- Installs dependencies
- Builds the production-ready files

### Publish Directory
```
dist
```
- This is where Vite outputs the built files
- Render will serve files from this directory

### Environment Variable
```
VITE_API_URL=https://petadoption-v2q3.onrender.com/api
```
- This connects your frontend to your backend API
- Make sure the backend URL is correct

---

## After Deployment

### Update Backend CORS Settings

You need to allow your frontend URL in the backend CORS settings:

1. Go to your backend service on Render
2. Go to "Environment" tab
3. Find `CORS_ALLOWED_ORIGINS` or add it:
   ```
   CORS_ALLOWED_ORIGINS=https://petadoption-frontend.onrender.com,https://petadoption-v2q3.onrender.com
   ```
4. Save and redeploy backend

Or update in `backend/backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://petadoption-frontend.onrender.com",
    "https://petadoption-v2q3.onrender.com",
]
```

---

## Troubleshooting

### Build Fails
- ✅ Check that Root Directory is set to `Frontend`
- ✅ Verify `package.json` exists in Frontend folder
- ✅ Check build logs for specific errors

### 404 Errors on Routes
- ✅ Render Static Sites handle SPA routing automatically
- ✅ If issues persist, check that `dist/index.html` exists after build

### API Not Working
- ✅ Verify `VITE_API_URL` environment variable is set
- ✅ Check browser console for CORS errors
- ✅ Make sure backend CORS allows your frontend URL

### Build Takes Too Long
- ✅ First build is slower (installing dependencies)
- ✅ Subsequent builds are faster (cached dependencies)

---

## Custom Domain (Optional)

1. Go to your static site settings
2. Click "Custom Domains"
3. Add your domain
4. Follow DNS configuration instructions

---

## Cost

**Static Sites on Render are FREE** on the free tier:
- ✅ Unlimited builds
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-deploy on git push

---

## Summary

**Deploy as:** Static Site ✅  
**Root Directory:** `Frontend`  
**Build Command:** `npm install && npm run build`  
**Publish Directory:** `dist`  
**Environment Variable:** `VITE_API_URL=https://petadoption-v2q3.onrender.com/api`

That's it! Your frontend will be live in minutes! 🚀

