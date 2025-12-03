# Render Deployment Guide

## Quick Deploy to Render + Neon

### Step 1: Create Neon PostgreSQL Database

1. Go to https://neon.tech/
2. Sign up with GitHub
3. Create new project: **"prescription-db"**
4. Copy the **DATABASE_URL** (looks like: `postgresql://user:password@host.neon.tech/dbname`)

### Step 2: Deploy to Render

1. Go to https://render.com/
2. Sign up with GitHub
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repository: **Murugadoss7/medicalapp**
5. Render will detect `render.yaml` automatically
6. Click **"Apply"**

### Step 3: Add Database URL

1. After deployment starts, go to your service
2. Click **"Environment"** tab
3. Add/Update:
   - Key: `DATABASE_URL`
   - Value: [Paste your Neon DATABASE_URL]
4. Click **"Save Changes"**
5. Service will auto-redeploy

### Step 4: Get Your Backend URL

1. Go to your service dashboard
2. Find the URL (looks like: `https://prescription-backend.onrender.com`)
3. Test it: `https://your-url.onrender.com/health`

### Step 5: Update Frontend

1. Go to Vercel dashboard
2. Your project → **Settings** → **Environment Variables**
3. Update `VITE_API_URL`:
   - Value: `https://your-render-url.onrender.com/api/v1`
4. Redeploy frontend

## Done! 🎉

Your stack:
- Frontend: Vercel (deployed ✅)
- Database: Neon PostgreSQL (free ✅)
- Backend: Render (free tier ✅)

## Cost: $0/month

**Note**: Free tier backend sleeps after 15 min inactivity (cold start ~30-60s).
Upgrade to $7/month for always-on service.
