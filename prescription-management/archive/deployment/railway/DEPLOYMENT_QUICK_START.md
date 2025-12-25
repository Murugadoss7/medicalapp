# Quick Start Deployment Guide

This is a simplified, step-by-step guide to deploy the Prescription Management System in ~20 minutes.

## Prerequisites

- GitHub account
- Vercel account (free): https://vercel.com
- Railway account (free trial): https://railway.app

---

## Step 1: Push Code to GitHub (5 minutes)

```bash
cd prescription-management

# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - ready for deployment"

# Create repository on GitHub (via web interface)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/prescription-management.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway (10 minutes)

### 2.1 Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authenticate GitHub and select your repository

### 2.2 Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Database is automatically created and linked

### 2.3 Configure Backend Service

1. Click "New" → "GitHub Repo"
2. Select your repository
3. Click "Add variables" and add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=<paste-generated-key-below>
JWT_SECRET_KEY=<paste-generated-key-below>
ENVIRONMENT=production
ALLOWED_ORIGINS=["*"]
```

**Generate keys**: Open Python and run:
```python
import secrets
print("SECRET_KEY:", secrets.token_urlsafe(32))
print("JWT_SECRET_KEY:", secrets.token_urlsafe(32))
```

4. Click "Settings" → "Deploy"
   - Root Directory: `backend`
   - Build Command: Leave empty (auto-detected)
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. Click "Deploy"

### 2.4 Get Backend URL

1. Wait for deployment to complete (3-5 minutes)
2. Go to "Settings" → "Networking" → "Public Networking"
3. Copy your backend URL (e.g., `https://prescription-backend-production.up.railway.app`)
4. **SAVE THIS URL** - you'll need it for frontend

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Import Project

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Import"

### 3.2 Configure Build Settings

1. **Framework Preset**: Vite (auto-detected)
2. **Root Directory**: Click "Edit" → Enter `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### 3.3 Add Environment Variable

1. Expand "Environment Variables" section
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-railway-backend-url.up.railway.app/api/v1`
   - (Replace with URL from Step 2.4, and add `/api/v1` at the end)
3. Click "Deploy"

### 3.4 Get Frontend URL

1. Wait for deployment (2-3 minutes)
2. Your frontend is live at: `https://your-project.vercel.app`
3. Click the URL to visit your deployed app

---

## Step 4: Initialize Database (2 minutes)

You need to create the database tables. Choose one method:

### Method A: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to database
railway connect postgres

# In the PostgreSQL prompt, paste and run your schema SQL
# (Copy from backend/init.sql or schema files)
```

### Method B: Using Database GUI Tool

1. In Railway, click on PostgreSQL database
2. Go to "Connect" tab
3. Copy "Postgres Connection URL"
4. Use a tool like TablePlus, pgAdmin, or DBeaver
5. Connect and run your schema SQL

### Method C: Using Supabase (Alternative)

If Railway database doesn't work, use Supabase:

1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Paste your schema SQL and run
5. Get connection string from Settings → Database
6. Update `DATABASE_URL` in Railway environment variables

---

## Step 5: Test Your Deployment (5 minutes)

### 5.1 Test Backend

```bash
# Health check
curl https://your-railway-backend.up.railway.app/api/v1/health

# Expected: {"status":"healthy"}
```

### 5.2 Test Frontend

1. Open your Vercel URL: `https://your-project.vercel.app`
2. Check that the login page loads
3. Open browser DevTools (F12) → Console
4. Look for any errors (red text)

### 5.3 Test Registration

1. Go to `/register` page
2. Create a test admin account:
   - Email: admin@test.com
   - Password: Admin123!
   - Role: Admin
3. Submit and verify success

### 5.4 Test Login

1. Login with test credentials
2. Verify you're redirected to dashboard
3. Check that data loads correctly

---

## Troubleshooting

### Frontend shows "Network Error"

**Problem**: API calls failing

**Solution**:
1. Check VITE_API_URL is correct in Vercel
2. Verify Railway backend is running (check logs)
3. Test backend URL directly: `curl https://your-backend.com/api/v1/health`

### Backend deployment failed

**Problem**: Build or start command error

**Solution**:
1. Check Railway logs for error message
2. Verify `requirements.txt` exists in `backend/` folder
3. Ensure start command is: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Database connection error

**Problem**: Backend can't connect to database

**Solution**:
1. Verify PostgreSQL service is running in Railway
2. Check that DATABASE_URL variable references `${{Postgres.DATABASE_URL}}`
3. Restart backend service

### "Module not found" errors

**Problem**: Missing dependencies

**Solution**:
1. Check that `requirements.txt` has all dependencies
2. Trigger redeploy in Railway

---

## What You Just Deployed

✅ **Frontend** (React/Vite): https://your-project.vercel.app
- Login/Registration pages
- Doctor dashboard
- Patient management
- Appointment booking
- Prescription creation
- Dental consultation (for dental doctors)

✅ **Backend** (FastAPI): https://your-backend.railway.app
- 117+ REST API endpoints
- JWT authentication
- Role-based access control
- Medical data management

✅ **Database** (PostgreSQL): Hosted on Railway
- User accounts
- Doctors, patients, appointments
- Prescriptions, medicines
- Dental observations/procedures

---

## Next Steps

After successful deployment:

1. **Create your admin account** via registration page

2. **Add test data**:
   - Create a doctor account
   - Add some patients
   - Book appointments
   - Create prescriptions

3. **Update CORS** (Security):
   - Go to Railway → Environment Variables
   - Update `ALLOWED_ORIGINS` to: `["https://your-project.vercel.app"]`
   - Redeploy backend

4. **Set up custom domain** (Optional):
   - In Vercel: Settings → Domains → Add
   - Follow DNS configuration steps

5. **Enable monitoring**:
   - Vercel Analytics (automatic)
   - Railway logs (available in dashboard)

6. **Set up backups**:
   - Railway: Automatic backups on paid plans
   - Or export database regularly with pg_dump

---

## Cost Summary

**Free tier (for testing)**:
- Frontend (Vercel): Free forever
- Backend (Railway): $5/month after free trial
- Database (Railway): Included with backend
- **Total**: ~$5/month

**Production ready**:
- Consider upgrading to paid plans for:
  - Better performance
  - More resources
  - Automatic backups
  - Priority support

---

## Support

Need help? Check:

1. **Full deployment guide**: `DEPLOYMENT_GUIDE.md`
2. **Railway logs**: Dashboard → Service → Logs
3. **Vercel logs**: Dashboard → Deployment → View Function Logs
4. **Test backend**: `curl https://your-backend.com/api/v1/health`

---

## Congratulations! 🎉

Your Prescription Management System is now live and accessible from anywhere in the world!

**Frontend**: https://your-project.vercel.app
**Backend**: https://your-backend.railway.app
**Status**: ✅ Deployed and running
