# Deployment Guide - Prescription Management System

## Overview

This guide covers deploying the Prescription Management System to production. The system consists of:
- **Frontend**: React/Vite application (deployable to Vercel)
- **Backend**: FastAPI application (requires separate hosting)
- **Database**: PostgreSQL (requires cloud hosting)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment Options](#backend-deployment-options)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for code repository)
- [ ] Vercel account (for frontend hosting) - https://vercel.com
- [ ] Backend hosting account (choose one):
  - Railway - https://railway.app
  - Render - https://render.com
  - DigitalOcean - https://digitalocean.com
  - AWS/GCP/Azure
- [ ] PostgreSQL database (choose one):
  - Supabase - https://supabase.com (recommended)
  - Neon - https://neon.tech
  - Railway PostgreSQL
  - Render PostgreSQL

### Local Requirements
- Node.js 18+ and npm
- Python 3.10+
- Git
- Vercel CLI (optional): `npm install -g vercel`

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Deployment

1. **Update environment variables**:
   ```bash
   cd prescription-management/frontend

   # Copy the production environment template
   cp .env.production .env.production.local

   # Edit .env.production.local with your backend URL
   # VITE_API_URL=https://your-backend-url.com/api/v1
   ```

2. **Test production build locally**:
   ```bash
   npm run build
   npm run preview
   ```

   Open http://localhost:4173 to verify the build works.

### Step 2: Deploy to Vercel (Method 1: Web Interface)

1. **Push code to GitHub**:
   ```bash
   cd prescription-management
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/prescription-management.git
   git push -u origin main
   ```

2. **Import project to Vercel**:
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Add environment variables in Vercel**:
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.com/api/v1`
   - Click "Save"

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your frontend will be live at: `https://your-project.vercel.app`

### Step 3: Deploy to Vercel (Method 2: CLI)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend directory
cd prescription-management/frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? prescription-management-frontend
# - Directory? ./
# - Override settings? No

# Set environment variable
vercel env add VITE_API_URL production

# Deploy to production
vercel --prod
```

### Step 4: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)

---

## Backend Deployment Options

The FastAPI backend requires a Python hosting service with PostgreSQL support. Choose one of the following options:

### Option A: Railway (Recommended - Easiest)

**Why Railway?**
- PostgreSQL included
- Easy Python deployment
- Free tier available
- Automatic HTTPS

**Steps**:

1. **Create Railway account**: https://railway.app

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the `prescription-management` repository

3. **Add PostgreSQL database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically creates a database
   - Note the connection URL (automatically added to environment)

4. **Configure backend service**:
   - Click "New" → "GitHub Repo" → Select your repo
   - Set root directory: `backend`
   - Railway auto-detects Python

5. **Add environment variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   SECRET_KEY=your-generated-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   ENVIRONMENT=production
   ```

6. **Configure build settings**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

7. **Deploy**:
   - Click "Deploy"
   - Wait for deployment (3-5 minutes)
   - Get your backend URL: `https://your-app.railway.app`

8. **Update frontend environment**:
   - Go back to Vercel
   - Update `VITE_API_URL` to your Railway backend URL
   - Redeploy frontend

### Option B: Render

**Steps**:

1. **Create Render account**: https://render.com

2. **Create PostgreSQL database**:
   - Dashboard → New → PostgreSQL
   - Name: `prescription-db`
   - Plan: Free (or paid for production)
   - Copy internal database URL

3. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect repository
   - Configure:
     - **Name**: prescription-backend
     - **Root Directory**: backend
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Add environment variables**:
   ```
   DATABASE_URL=<your-postgres-internal-url>
   SECRET_KEY=<generate-secret-key>
   JWT_SECRET_KEY=<generate-jwt-secret>
   ENVIRONMENT=production
   ```

5. **Deploy and get URL**

### Option C: DigitalOcean App Platform

**Steps**:

1. **Create DigitalOcean account**: https://digitalocean.com

2. **Create Managed PostgreSQL**:
   - Create → Databases → PostgreSQL
   - Choose plan and region
   - Note connection details

3. **Create App**:
   - Create → Apps → GitHub
   - Select repository
   - Configure:
     - **Type**: Web Service
     - **Source Directory**: backend
     - **Build Command**: `pip install -r requirements.txt`
     - **Run Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8080`

4. **Add environment variables** (same as above)

---

## Database Setup

### Option 1: Supabase (Recommended)

1. **Create project**: https://supabase.com/dashboard
2. **Get connection string**:
   - Go to Project Settings → Database
   - Copy "Connection string" (Postgres)
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`

3. **Run migrations**:
   ```bash
   # Install psql client locally or use Supabase SQL Editor

   # Option A: Using psql
   psql "postgresql://postgres:[password]@[host]:5432/postgres" < backend/init.sql

   # Option B: Using Supabase SQL Editor
   # - Go to SQL Editor in Supabase dashboard
   # - Copy contents of backend/init.sql
   # - Execute
   ```

4. **Update backend environment**:
   - Set `DATABASE_URL` to your Supabase connection string

### Option 2: Neon

1. **Create project**: https://neon.tech
2. **Get connection string** from dashboard
3. **Run migrations** (same as Supabase)

---

## Environment Configuration

### Frontend Environment Variables

Create `.env.production` in `frontend/` directory:

```bash
# Production API URL (update with your backend URL)
VITE_API_URL=https://your-backend-url.com/api/v1
```

### Backend Environment Variables

Required environment variables for backend:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Security
SECRET_KEY=your-secret-key-at-least-32-characters-long
JWT_SECRET_KEY=another-secret-key-for-jwt-tokens
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=production

# CORS (update with your Vercel frontend URL)
ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]

# Optional: Email configuration (for future features)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
```

### Generate Secret Keys

Use Python to generate secure secret keys:

```python
import secrets

# Generate SECRET_KEY
print("SECRET_KEY:", secrets.token_urlsafe(32))

# Generate JWT_SECRET_KEY
print("JWT_SECRET_KEY:", secrets.token_urlsafe(32))
```

Or use OpenSSL:

```bash
openssl rand -base64 32
```

---

## Post-Deployment Testing

### 1. Health Check

Test backend health endpoint:
```bash
curl https://your-backend-url.com/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. Frontend Access

1. Open your Vercel URL: `https://your-frontend.vercel.app`
2. Verify pages load correctly
3. Check browser console for errors

### 3. Authentication Flow

1. Register a new user:
   - Go to `/register`
   - Create test admin account
   - Verify email validation works

2. Login:
   - Go to `/login`
   - Login with test credentials
   - Verify redirect to dashboard

3. Test API calls:
   - Open browser DevTools → Network
   - Navigate to different pages
   - Verify API calls succeed (200 status)

### 4. Full Workflow Test

Test complete workflow:
1. Create doctor
2. Create patient
3. Book appointment
4. Create prescription
5. View prescription

---

## Troubleshooting

### Frontend Issues

**Issue**: "Network Error" or "Failed to fetch"
- **Cause**: CORS issue or wrong API URL
- **Solution**:
  - Verify `VITE_API_URL` in Vercel environment variables
  - Check backend CORS configuration includes your Vercel domain

**Issue**: Blank page or "Cannot GET /"
- **Cause**: Routing not configured properly
- **Solution**: Verify `vercel.json` includes rewrite rules

**Issue**: Environment variables not working
- **Cause**: Variables not prefixed with `VITE_`
- **Solution**: All Vite environment variables must start with `VITE_`

### Backend Issues

**Issue**: "Database connection failed"
- **Cause**: Wrong connection string or database not accessible
- **Solution**:
  - Verify `DATABASE_URL` format
  - Check database allows connections from hosting provider IP
  - Test connection locally first

**Issue**: "Module not found" errors
- **Cause**: Dependencies not installed
- **Solution**:
  - Verify `requirements.txt` is in root directory
  - Check build command installs dependencies

**Issue**: "Application failed to start"
- **Cause**: Port binding issue
- **Solution**:
  - Use `--host 0.0.0.0` in uvicorn command
  - Bind to `$PORT` environment variable provided by host

### Database Issues

**Issue**: Tables don't exist
- **Cause**: Migrations not run
- **Solution**: Run database initialization script or migrations

**Issue**: Permission denied
- **Cause**: Database user doesn't have required permissions
- **Solution**: Grant necessary permissions to database user

---

## Monitoring and Maintenance

### Logs

**Vercel Logs**:
- Dashboard → Your Project → Deployments → View logs

**Railway Logs**:
- Project → Service → View logs

**Render Logs**:
- Dashboard → Service → Logs tab

### Performance Monitoring

1. **Frontend**: Use Vercel Analytics
2. **Backend**: Set up logging service (Sentry, LogRocket)
3. **Database**: Monitor query performance in provider dashboard

### Backups

**Database Backups**:
- Supabase: Automatic backups (paid plans)
- Railway: Point-in-time recovery
- Manual: Use `pg_dump` to backup regularly

```bash
# Backup command
pg_dump "postgresql://user:pass@host:5432/db" > backup.sql

# Restore command
psql "postgresql://user:pass@host:5432/db" < backup.sql
```

---

## Estimated Costs

### Free Tier Setup
- **Frontend (Vercel)**: Free
- **Backend (Railway)**: $5/month (after free trial)
- **Database (Supabase)**: Free (up to 500MB)
- **Total**: ~$5/month

### Production Setup
- **Frontend (Vercel Pro)**: $20/month
- **Backend (Railway Pro)**: $20-50/month
- **Database (Supabase Pro)**: $25/month
- **Total**: ~$65-95/month

---

## Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Generate new secret keys (don't use development keys)
- [ ] Enable HTTPS (automatic with Vercel/Railway)
- [ ] Configure CORS to only allow your frontend domain
- [ ] Set up database firewall rules
- [ ] Enable rate limiting (future enhancement)
- [ ] Set up monitoring and alerting
- [ ] Create database backups
- [ ] Review and update security headers
- [ ] Test authentication and authorization flows

---

## Next Steps

After successful deployment:

1. Set up custom domain
2. Configure SSL certificates (if not automatic)
3. Set up monitoring and logging
4. Create staging environment for testing
5. Set up CI/CD pipeline for automatic deployments
6. Configure backup strategy
7. Set up error tracking (Sentry)
8. Enable analytics

---

## Support

If you encounter issues during deployment:

1. Check logs in your hosting provider dashboard
2. Verify all environment variables are set correctly
3. Test backend API endpoints directly with curl/Postman
4. Check CORS configuration
5. Verify database connection from backend

---

## Quick Deployment Summary

**Fastest path to deployment**:

1. **Frontend → Vercel** (5 minutes)
   - Push to GitHub
   - Import to Vercel
   - Set `VITE_API_URL` environment variable
   - Deploy

2. **Backend → Railway** (10 minutes)
   - Create Railway project
   - Add PostgreSQL database
   - Deploy from GitHub
   - Set environment variables
   - Get backend URL

3. **Update Frontend** (2 minutes)
   - Update `VITE_API_URL` in Vercel with Railway backend URL
   - Redeploy

**Total time**: ~20 minutes
