# Google Cloud Run Deployment Guide
## Hybrid Approach: Vercel (Frontend) + Cloud Run (Backend) + Neon (DB) + R2 (Storage)

**Estimated Monthly Cost:** $2-10/month
- **Frontend (Vercel):** FREE (Hobby tier)
- **Backend (Cloud Run):** $2-5/month (100 requests/day with generous free tier)
- **Database (Neon):** FREE (0.5GB storage + 191 compute hours)
- **Storage (Cloudflare R2):** FREE up to 10GB

---

## Prerequisites

### 1. Install Google Cloud CLI
```bash
# macOS
brew install --cask google-cloud-sdk

# Verify installation
gcloud --version
```

### 2. Authenticate with Google Cloud
```bash
# Login to your Google account
gcloud auth login

# Set up application default credentials
gcloud auth application-default login
```

### 3. Create Google Cloud Project
```bash
# Create a new project (or use existing)
gcloud projects create medical-app-prod --name="Medical App Production"

# Set as active project
gcloud config set project medical-app-prod

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

---

## Part 1: Backend Deployment to Google Cloud Run

### Step 1: Prepare Environment Variables

Create a `.env.production` file in `prescription-management/backend/`:

```bash
# Environment
ENVIRONMENT=production
DEBUG=False

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://[USERNAME]:[PASSWORD]@[NEON_HOST]/[DATABASE_NAME]?sslmode=require

# Security (CRITICAL: Generate new secrets for production)
JWT_SECRET_KEY=your-super-secret-jwt-key-here-minimum-32-chars
SECRET_KEY=your-super-secret-app-key-here-minimum-32-chars

# CORS (Add your Vercel domain)
ALLOWED_ORIGINS=["https://your-app.vercel.app","https://your-custom-domain.com"]

# Cloudflare R2 Storage
CLOUD_STORAGE_PROVIDER=cloudflare
CLOUDFLARE_R2_ACCESS_KEY=your-r2-access-key
CLOUDFLARE_R2_SECRET_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET=dental-attachments
CLOUDFLARE_R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# OpenAI (Optional - for AI case studies)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Redis (Optional - can disable for cost savings)
REDIS_URL=redis://your-upstash-redis-url

# Base URL
BASE_URL=https://medical-app-prod-xxxxx.run.app
```

### Step 2: Build and Deploy to Cloud Run

```bash
cd prescription-management/backend

# Build and deploy in one command
gcloud run deploy medical-app-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8000 \
  --env-vars-file .env.production

# Alternative: Deploy from pre-built image
# docker build -t gcr.io/medical-app-prod/backend:latest .
# docker push gcr.io/medical-app-prod/backend:latest
# gcloud run deploy medical-app-backend --image gcr.io/medical-app-prod/backend:latest ...
```

### Step 3: Get Backend URL
```bash
# After deployment, note the URL
gcloud run services describe medical-app-backend --region us-central1 --format 'value(status.url)'

# Example output: https://medical-app-backend-xxxxx-uc.a.run.app
```

---

## Part 2: Configure Neon PostgreSQL

### Option A: Use Existing Neon Database
1. Login to Neon Console: https://console.neon.tech
2. Navigate to your existing database
3. Get connection string from **Connection Details**
4. Format: `postgresql://[user]:[password]@[host]/[db]?sslmode=require`
5. Update `DATABASE_URL` in `.env.production`

### Option B: Create New Neon Database
```bash
# 1. Create new project in Neon Console
# 2. Create database named "prescription_management"
# 3. Run migrations

# Set DATABASE_URL environment variable locally
export DATABASE_URL="postgresql://[user]:[password]@[neon-host]/prescription_management?sslmode=require"

# Run Alembic migrations
cd prescription-management/backend
alembic upgrade head
```

---

## Part 3: Configure Cloudflare R2 Storage

### Get R2 Credentials
1. Login to Cloudflare Dashboard: https://dash.cloudflare.com
2. Navigate to **R2** > **Overview**
3. Click **Manage R2 API Tokens**
4. Create new API token with:
   - **Permissions:** Object Read & Write
   - **Bucket:** dental-attachments (or create new)
5. Note down:
   - `Access Key ID` → `CLOUDFLARE_R2_ACCESS_KEY`
   - `Secret Access Key` → `CLOUDFLARE_R2_SECRET_KEY`
   - `Endpoint URL` → `CLOUDFLARE_R2_ENDPOINT`

### Create Public Domain for R2 Bucket
1. In R2 bucket settings, enable **Public Access**
2. Connect custom domain or use default: `https://pub-xxxxx.r2.dev`
3. Update `CLOUDFLARE_R2_PUBLIC_URL` in environment variables

---

## Part 4: Frontend Deployment to Vercel

### Step 1: Update Frontend Environment Variables

Create/Update `.env.production` in `prescription-management/frontend/`:

```bash
# Backend API URL (from Cloud Run)
VITE_API_URL=https://medical-app-backend-xxxxx-uc.a.run.app/api/v1
```

### Step 2: Deploy to Vercel

```bash
cd prescription-management/frontend

# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variable in Vercel
vercel env add VITE_API_URL production
# Paste: https://medical-app-backend-xxxxx-uc.a.run.app/api/v1
```

### Alternative: Deploy via Vercel Dashboard
1. Login to https://vercel.com
2. Import repository from GitHub
3. Set **Root Directory:** `prescription-management/frontend`
4. Add environment variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://medical-app-backend-xxxxx-uc.a.run.app/api/v1`
5. Click **Deploy**

---

## Part 5: Update CORS Configuration

After deploying frontend, update backend CORS settings:

```bash
# Get your Vercel frontend URL
# Example: https://medical-app-xxxxx.vercel.app

# Update Cloud Run environment variable
gcloud run services update medical-app-backend \
  --region us-central1 \
  --update-env-vars ALLOWED_ORIGINS='["https://medical-app-xxxxx.vercel.app"]'
```

---

## Cost Optimization Tips

### 1. Cloud Run (Backend)
```bash
# Set minimum instances to 0 (scale to zero when idle)
--min-instances 0

# Reduce memory if not using PDF generation heavily
--memory 512Mi  # Start with 512MB, increase if needed

# Set timeout based on your slowest endpoint
--timeout 300  # 5 minutes for PDF generation
```

### 2. Database (Neon)
- **Free tier includes:**
  - 0.5GB storage
  - 191 compute hours/month (~8 days of constant use)
- **Optimization:**
  - Enable auto-scaling to sleep during inactivity
  - Use connection pooling (already configured in SQLAlchemy)

### 3. Storage (Cloudflare R2)
- **Free tier:** 10GB storage + 1M Class A operations
- **Optimization:**
  - Compress images before upload
  - Set expiration policies for temporary files
  - Use CDN caching

### 4. Redis (Optional)
- **Option 1:** Disable Redis (remove from requirements)
- **Option 2:** Use Upstash Redis (free tier: 10,000 commands/day)
  ```bash
  # Upstash Redis URL format
  REDIS_URL=rediss://default:[PASSWORD]@[UPSTASH_HOST]:6379
  ```

---

## Monitoring & Logs

### View Cloud Run Logs
```bash
# Real-time logs
gcloud run services logs tail medical-app-backend --region us-central1

# Recent logs
gcloud run services logs read medical-app-backend --region us-central1 --limit 50
```

### Cloud Run Metrics
```bash
# Open in browser
gcloud run services describe medical-app-backend --region us-central1 --format 'value(status.url)' | xargs -I {} open "https://console.cloud.google.com/run/detail/us-central1/medical-app-backend/metrics"
```

### Vercel Logs
- Visit: https://vercel.com/dashboard
- Select your project → **Deployments** → Click deployment → **Logs**

---

## Deployment Checklist

- [ ] Google Cloud project created and configured
- [ ] Cloud Run APIs enabled
- [ ] Neon PostgreSQL database created and migrations run
- [ ] Cloudflare R2 bucket created with public access
- [ ] `.env.production` file created with all credentials
- [ ] Backend deployed to Cloud Run successfully
- [ ] Frontend environment variables updated with Cloud Run URL
- [ ] Frontend deployed to Vercel successfully
- [ ] CORS configuration updated with Vercel domain
- [ ] Test end-to-end: registration, login, appointments, prescriptions
- [ ] Verify file uploads work with R2 storage
- [ ] Check Cloud Run logs for errors
- [ ] Monitor costs in Google Cloud Console

---

## Common Issues & Troubleshooting

### 1. CORS Errors
**Symptom:** Frontend can't connect to backend
**Solution:**
```bash
gcloud run services update medical-app-backend \
  --region us-central1 \
  --update-env-vars ALLOWED_ORIGINS='["https://your-app.vercel.app","http://localhost:5173"]'
```

### 2. Database Connection Timeout
**Symptom:** `could not connect to server`
**Solution:**
- Ensure DATABASE_URL includes `?sslmode=require`
- Check Neon database is active (not suspended)
- Verify connection string is correct

### 3. File Upload Fails
**Symptom:** 500 error on file upload
**Solution:**
- Verify Cloudflare R2 credentials are correct
- Check bucket permissions (Object Read & Write)
- Ensure `CLOUD_STORAGE_PROVIDER=cloudflare` is set

### 4. Cloud Run Cold Starts
**Symptom:** First request takes 5-10 seconds
**Solution:**
```bash
# Keep 1 instance always warm (costs ~$5/month extra)
gcloud run services update medical-app-backend \
  --region us-central1 \
  --min-instances 1
```

---

## Rollback & Updates

### Update Deployment
```bash
cd prescription-management/backend

# Re-deploy after code changes
gcloud run deploy medical-app-backend \
  --source . \
  --region us-central1
```

### Rollback to Previous Version
```bash
# List revisions
gcloud run revisions list --service medical-app-backend --region us-central1

# Rollback to specific revision
gcloud run services update-traffic medical-app-backend \
  --region us-central1 \
  --to-revisions medical-app-backend-00002-abc=100
```

---

## Estimated Costs Breakdown

| Service | Free Tier | Expected Usage | Monthly Cost |
|---------|-----------|----------------|--------------|
| **Vercel** | Unlimited | 100GB bandwidth | **$0** |
| **Cloud Run** | 2M requests, 360k GB-sec | ~3k requests/month | **$0-2** |
| **Neon PostgreSQL** | 0.5GB + 191 hrs | ~100MB + 50 hrs | **$0** |
| **Cloudflare R2** | 10GB + 1M ops | ~2GB + 10k ops | **$0** |
| **Upstash Redis** (optional) | 10k commands/day | ~5k/day | **$0** |
| **Total** | — | Low traffic medical app | **$0-2/month** |

**With moderate traffic (10k requests/month):** $2-5/month
**With high traffic (100k requests/month):** $5-10/month

---

## Next Steps

1. Run deployment script (see below)
2. Test all features in production
3. Set up monitoring alerts
4. Configure custom domain (optional)
5. Enable HTTPS (automatic with Cloud Run & Vercel)
6. Set up backups for Neon database

---

## Automated Deployment Script

Save this as `deploy-cloudrun.sh` in `prescription-management/backend/`:

```bash
#!/bin/bash

# Google Cloud Run Deployment Script
# Usage: ./deploy-cloudrun.sh

set -e

echo "🚀 Deploying Medical App Backend to Google Cloud Run..."

# Configuration
PROJECT_ID="medical-app-prod"
SERVICE_NAME="medical-app-backend"
REGION="us-central1"

# Set project
gcloud config set project $PROJECT_ID

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8000 \
  --env-vars-file .env.production

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo "✅ Deployment successful!"
echo "🌐 Backend URL: $SERVICE_URL"
echo ""
echo "Next steps:"
echo "1. Update frontend VITE_API_URL to: $SERVICE_URL/api/v1"
echo "2. Update CORS ALLOWED_ORIGINS with your Vercel domain"
echo "3. Test the application end-to-end"
```

Make it executable:
```bash
chmod +x deploy-cloudrun.sh
```
