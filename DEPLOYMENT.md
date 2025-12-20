# Frontend Deployment Guide

This guide explains how to deploy the PetReunite frontend to various platforms.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

**Steps:**
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository: `SaiManjith07/petadoption`
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Add Environment Variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com/api`
6. Click "Deploy"

**That's it!** Vercel will automatically:
- Build your app
- Deploy it
- Give you a URL like `https://your-app.vercel.app`
- Set up automatic deployments on every push to main

---

### Option 2: Netlify

**Steps:**
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository: `SaiManjith07/petadoption`
4. Configure build settings:
   - **Base directory:** `Frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `Frontend/dist`
5. Add Environment Variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com/api`
6. Click "Deploy site"

**Done!** You'll get a URL like `https://your-app.netlify.app`

---

### Option 3: Render (Same as Backend)

**Steps:**
1. Go to [render.com](https://render.com) dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository: `SaiManjith07/petadoption`
4. Configure:
   - **Name:** `petadoption-frontend` (or any name)
   - **Branch:** `main`
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Add Environment Variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com/api`
6. Click "Create Static Site"

**That's it!** You'll get a URL like `https://your-app.onrender.com`

---

### Option 4: Cloudflare Pages

**Steps:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to "Pages" → "Create a project"
3. Connect your GitHub repository: `SaiManjith07/petadoption`
4. Configure:
   - **Project name:** `petadoption-frontend`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `Frontend/dist`
   - **Root directory:** `Frontend`
5. Add Environment Variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://petadoption-v2q3.onrender.com/api`
6. Click "Save and Deploy"

---

## 📝 Important Notes

### Environment Variables
All platforms require the `VITE_API_URL` environment variable to be set:
```
VITE_API_URL=https://petadoption-v2q3.onrender.com/api
```

### Custom Domain (Optional)
After deployment, you can add a custom domain in your platform's settings.

### Automatic Deployments
All platforms will automatically redeploy when you push to your main branch.

---

## 🎯 Recommendation

**Use Vercel** - It's the easiest and most popular for React/Vite apps:
- ✅ Zero configuration needed
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier is generous
- ✅ Best performance for React apps

---

## 🔧 Troubleshooting

### Build Fails
- Make sure `Root Directory` is set to `Frontend`
- Check that `package.json` has the build script
- Verify Node.js version (should be 18+)

### API Not Working
- Check that `VITE_API_URL` environment variable is set correctly
- Verify CORS is enabled on your backend
- Check browser console for errors

### 404 Errors on Routes
- Make sure the platform is configured to serve `index.html` for all routes (SPA routing)
- Vercel: Already configured in `vercel.json`
- Netlify: Already configured in `netlify.toml` and `_redirects`
- Render: Add redirect rule in settings
- Cloudflare: Add redirect rule in settings

---

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Render Docs](https://render.com/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)

