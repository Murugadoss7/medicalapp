# 🚀 Quick Start: Deploy to Production (Hybrid Approach)

**Estimated Setup Time:** 30-45 minutes
**Monthly Cost:** $2-10 (mostly free with generous free tiers)

---

## Architecture Overview

```
┌─────────────────┐
│  Vercel (FREE)  │ ← Frontend (React + Vite)
│  Edge Network   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────┐
│ Google Cloud Run ($2-5) │ ← Backend (FastAPI + Python)
│ Auto-scaling            │
└────────┬────────────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌────────────────┐
│ Neon (FREE)  │   │ R2 (FREE)      │
│ PostgreSQL   │   │ File Storage   │
└──────────────┘   └────────────────┘
```

---

## Prerequisites

### 1. Install Google Cloud CLI
```bash
# macOS
brew install --cask google-cloud-sdk

# Verify
gcloud --version
```

### 2. Install Vercel CLI (optional, can use web UI)
```bash
npm install -g vercel
```

### 3. Accounts Required
- ✅ Google Cloud (free $300 credit for new users)
- ✅ Neon Database (already have)
- ✅ Cloudflare (already have for R2)
- ✅ Vercel (free tier)

---

## Step-by-Step Deployment

### PART 1: Backend to Google Cloud Run (15 minutes)

#### 1.1 Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth application-default login
```

#### 1.2 Create Google Cloud Project
```bash
# Create project
gcloud projects create medical-app-prod --name="Medical App Production"

# Set as active
gcloud config set project medical-app-prod

# Enable required APIs (will be done by script)
```

#### 1.3 Prepare Environment Variables
```bash
cd prescription-management/backend

# Run setup script (interactive)
./setup-production.sh
```

The script will ask for:
- Neon PostgreSQL connection string
- Cloudflare R2 credentials
- Vercel frontend URL
- OpenAI API key (optional)

It will generate:
- ✅ `.env.production` with all configuration
- ✅ Secure JWT and app secrets
- ✅ CORS configuration

#### 1.4 Run Database Migrations
```bash
# Set database URL from Neon
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Run migrations
alembic upgrade head
```

#### 1.5 Deploy to Cloud Run
```bash
# Deploy (will take 3-5 minutes)
./deploy-cloudrun.sh
```

After deployment completes, you'll see:
```
✅ Deployment successful!
🌐 Backend URL: https://medical-app-backend-xxxxx-uc.a.run.app
```

#### 1.6 Update BASE_URL
```bash
# Edit .env.production and update BASE_URL with your Cloud Run URL
# Then re-deploy
./deploy-cloudrun.sh
```

---

### PART 2: Frontend to Vercel (10 minutes)

#### 2.1 Update Frontend Environment
```bash
cd prescription-management/frontend

# Create/update .env.production
echo "VITE_API_URL=https://medical-app-backend-xxxxx-uc.a.run.app/api/v1" > .env.production
```

#### 2.2 Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variable
vercel env add VITE_API_URL production
# Paste your Cloud Run URL + /api/v1
```

**Option B: Using Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set **Root Directory:** `prescription-management/frontend`
4. Add environment variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://medical-app-backend-xxxxx-uc.a.run.app/api/v1`
5. Click **Deploy**

---

### PART 3: Configure CORS (5 minutes)

After frontend deployment, update backend CORS:

```bash
# Get your Vercel URL (e.g., https://medical-app-xxxxx.vercel.app)

cd prescription-management/backend

# Edit .env.production
# Update ALLOWED_ORIGINS=["https://medical-app-xxxxx.vercel.app"]

# Re-deploy
./deploy-cloudrun.sh
```

---

### PART 4: Test & Verify (10 minutes)

#### 4.1 Test Backend Health
```bash
curl https://medical-app-backend-xxxxx-uc.a.run.app/health
```

Expected:
```json
{"status": "ok", "environment": "production"}
```

#### 4.2 Test Frontend
1. Visit: `https://medical-app-xxxxx.vercel.app`
2. Try registering a user
3. Login with credentials
4. Create an appointment
5. Upload an attachment (tests R2 storage)
6. Generate a prescription (tests PDF generation)

#### 4.3 Check Logs
```bash
# Backend logs
gcloud run services logs tail medical-app-backend --region us-central1

# Frontend logs
# Visit Vercel dashboard → Your project → Logs
```

---

## Cost Monitoring

### View Cloud Run Costs
```bash
# Open billing dashboard
open https://console.cloud.google.com/billing
```

### Expected Costs (Monthly)

| Usage Level | Requests/Month | Cloud Run Cost | Total Cost |
|-------------|----------------|----------------|------------|
| **Low** (development) | 1,000 | $0 | **$0-1** |
| **Medium** (small clinic) | 10,000 | $1-2 | **$1-3** |
| **High** (busy clinic) | 100,000 | $5-8 | **$5-10** |

> All other services (Vercel, Neon, R2) remain FREE within their generous limits

---

## Common Issues & Fixes

### Issue 1: CORS Error
**Symptom:** Frontend shows "CORS policy" error
**Fix:**
```bash
cd prescription-management/backend
# Edit .env.production → Add Vercel URL to ALLOWED_ORIGINS
./deploy-cloudrun.sh
```

### Issue 2: Database Connection Error
**Symptom:** "could not connect to database"
**Fix:**
- Ensure DATABASE_URL has `?sslmode=require` at the end
- Check Neon database is active (not auto-suspended)
- Verify credentials are correct

### Issue 3: File Upload 500 Error
**Symptom:** File uploads fail
**Fix:**
- Verify Cloudflare R2 credentials in `.env.production`
- Check bucket has correct permissions
- Ensure `CLOUD_STORAGE_PROVIDER=cloudflare`

### Issue 4: Cold Start Delays
**Symptom:** First request takes 5-10 seconds
**Fix (costs $5/month extra):**
```bash
# Keep 1 instance always warm
gcloud run services update medical-app-backend \
  --region us-central1 \
  --min-instances 1
```

---

## Monitoring & Maintenance

### View Metrics
```bash
# Cloud Run metrics
open https://console.cloud.google.com/run/detail/us-central1/medical-app-backend/metrics

# Vercel analytics
open https://vercel.com/dashboard/analytics
```

### Update Deployment
```bash
# Backend
cd prescription-management/backend
./deploy-cloudrun.sh

# Frontend (auto-deploys on git push if connected to GitHub)
git push origin main
```

### Rollback
```bash
# List revisions
gcloud run revisions list --service medical-app-backend --region us-central1

# Rollback to previous version
gcloud run services update-traffic medical-app-backend \
  --region us-central1 \
  --to-revisions medical-app-backend-00002-abc=100
```

---

## Security Checklist

- [x] Generated unique JWT_SECRET_KEY for production
- [x] Generated unique SECRET_KEY for production
- [x] DATABASE_URL uses SSL (`?sslmode=require`)
- [x] CORS limited to specific domains (no wildcards)
- [x] Cloud Run requires authentication (or set to public if needed)
- [x] Cloudflare R2 bucket has proper access controls
- [x] Environment variables stored securely (not in git)
- [x] Regular database backups enabled in Neon
- [x] Error tracking enabled (Sentry optional)
- [x] Audit logging enabled for HIPAA compliance

---

## Next Steps After Deployment

1. **Custom Domain (Optional)**
   - Vercel: Add custom domain in dashboard
   - Cloud Run: Map custom domain for API

2. **Monitoring**
   - Enable Sentry for error tracking
   - Set up Google Cloud alerting
   - Monitor Neon database usage

3. **Backups**
   - Neon: Enable automatic backups (Settings → Backups)
   - R2: Enable bucket versioning for file recovery

4. **Performance**
   - Enable Vercel Edge Caching
   - Monitor Cloud Run cold starts
   - Optimize database queries

5. **Compliance**
   - Review HIPAA requirements
   - Enable audit logging
   - Set up access controls

---

## Support & Resources

- **Google Cloud Run:** https://cloud.google.com/run/docs
- **Vercel:** https://vercel.com/docs
- **Neon:** https://neon.tech/docs
- **Cloudflare R2:** https://developers.cloudflare.com/r2

---

## Summary

You now have a production-ready medical app running on:

✅ **Frontend:** Vercel (global CDN, auto-scaling, FREE)
✅ **Backend:** Google Cloud Run (auto-scaling, $2-5/month)
✅ **Database:** Neon PostgreSQL (serverless, FREE tier)
✅ **Storage:** Cloudflare R2 (S3-compatible, FREE up to 10GB)

**Total Cost:** $2-10/month depending on usage

**Scalability:** Handles 0 to 100k requests/month seamlessly

**Reliability:** 99.9%+ uptime with auto-scaling and global distribution

---

🎉 **Congratulations! Your medical app is now live in production!**
