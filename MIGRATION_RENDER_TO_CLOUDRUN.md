# Migration Guide: Render → Google Cloud Run

**Current Setup:** Vercel + Render (Docker) + Neon + R2
**New Setup:** Vercel + Cloud Run (Docker) + Neon + R2

**Changes Required:** Only backend hosting (Render → Cloud Run)
**Everything Else:** Stays exactly the same!

---

## ✅ What Stays the Same

| Component | Current | After Migration | Status |
|-----------|---------|-----------------|--------|
| **Frontend** | Vercel | Vercel | ✅ No change |
| **Database** | Neon PostgreSQL | Neon PostgreSQL | ✅ No change |
| **Storage** | Cloudflare R2 | Cloudflare R2 | ✅ No change |
| **Docker** | Same Dockerfile | Same Dockerfile | ✅ No change |
| **Env Vars** | Same variables | Same variables | ✅ No change |
| **Auto-deploy** | Git push → Render | Git push → Cloud Run | ✅ Same experience |

---

## 🔄 What Changes

| Component | Current | After Migration |
|-----------|---------|-----------------|
| **Backend Host** | Render | Google Cloud Run |
| **Backend URL** | `prescription-backend.onrender.com` | `medical-app-backend-xxxxx.run.app` |
| **Deployment** | `render.yaml` | GitHub Actions |
| **Monthly Cost** | $7-21 (Render paid tiers) | $2-5 (Cloud Run) |

---

## 🚀 Migration Steps (30 minutes total)

### Step 1: Set Up Google Cloud Project (10 min)

#### 1.1 Install Google Cloud CLI
```bash
# macOS
brew install --cask google-cloud-sdk

# Verify
gcloud --version
```

#### 1.2 Create Google Cloud Project
```bash
# Login
gcloud auth login

# Create project
gcloud projects create medical-app-prod --name="Medical App Production"

# Set as active
gcloud config set project medical-app-prod

# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 1.3 Create Service Account for GitHub Actions
```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment"

# Grant permissions
gcloud projects add-iam-policy-binding medical-app-prod \
  --member="serviceAccount:github-actions@medical-app-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding medical-app-prod \
  --member="serviceAccount:github-actions@medical-app-prod.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding medical-app-prod \
  --member="serviceAccount:github-actions@medical-app-prod.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create key file
gcloud iam service-accounts keys create ~/gcp-key.json \
  --iam-account=github-actions@medical-app-prod.iam.gserviceaccount.com
```

**Important:** Save the content of `~/gcp-key.json` - you'll need it for GitHub Secrets.

---

### Step 2: Configure GitHub Secrets (10 min)

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `GCP_SA_KEY` | Content of `~/gcp-key.json` | From Step 1.3 |
| `DATABASE_URL` | Your Neon connection string | Neon Dashboard → Connection Details |
| `JWT_SECRET_KEY` | Generate new: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` | Terminal |
| `SECRET_KEY` | Generate new: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` | Terminal |
| `ALLOWED_ORIGINS` | `["https://medicalapp-three.vercel.app","https://your-custom-domain.com"]` | Your Vercel URL |
| `CLOUDFLARE_R2_ACCESS_KEY` | Your R2 access key | Cloudflare R2 Dashboard |
| `CLOUDFLARE_R2_SECRET_KEY` | Your R2 secret key | Cloudflare R2 Dashboard |
| `CLOUDFLARE_R2_ENDPOINT` | `https://f42317fc96bdacba47587301bd7ed6b6.r2.cloudflarestorage.com` | From render.yaml |
| `CLOUDFLARE_R2_PUBLIC_URL` | Your R2 public URL | Cloudflare R2 Dashboard |
| `OPENAI_API_KEY` | Your OpenAI API key (optional) | OpenAI Dashboard |
| `BASE_URL` | Leave as `https://medical-app-backend-xxxxx.run.app` (update after first deploy) | Will get after deployment |

**Screenshot Location:**
GitHub → Your Repo → Settings → Secrets and variables → Actions

---

### Step 3: Deploy to Cloud Run (5 min)

#### 3.1 Push GitHub Actions Workflow
```bash
cd /Users/murugadoss/MedicalApp

# Add workflow file (already created)
git add .github/workflows/deploy-cloudrun.yml

# Commit
git commit -m "feat: Add Cloud Run auto-deployment via GitHub Actions"

# Push to development branch
git push origin development
```

#### 3.2 Monitor Deployment
1. Go to GitHub → Your Repo → **Actions** tab
2. You'll see "Deploy Backend to Google Cloud Run" workflow running
3. Wait 3-5 minutes for build and deployment
4. Check logs for your Cloud Run URL

#### 3.3 Get Your Cloud Run URL
After deployment completes, you'll see:
```
✅ Backend deployed successfully!
🌐 URL: https://medical-app-backend-xxxxx-uc.a.run.app
```

Copy this URL!

---

### Step 4: Update Frontend Environment (5 min)

#### 4.1 Update Vercel Environment Variable
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `medicalapp`
3. **Settings** → **Environment Variables**
4. Find `VITE_API_URL` and update:
   - **Value:** `https://medical-app-backend-xxxxx-uc.a.run.app/api/v1`
   - Click **Save**

#### 4.2 Redeploy Frontend
```bash
# Trigger Vercel redeploy
cd prescription-management/frontend
git commit --allow-empty -m "chore: Trigger Vercel redeploy"
git push origin development
```

Or manually redeploy in Vercel Dashboard:
- Deployments → Latest → **⋯** → **Redeploy**

---

### Step 5: Update CORS Configuration (2 min)

#### 5.1 Update GitHub Secret
1. Go to GitHub → Settings → Secrets → Actions
2. Update `BASE_URL` secret with your Cloud Run URL:
   - Value: `https://medical-app-backend-xxxxx-uc.a.run.app`

#### 5.2 Trigger Redeployment
```bash
# Make a small change to trigger redeploy
cd prescription-management/backend
echo "# Updated $(date)" >> README.md
git add .
git commit -m "chore: Update BASE_URL for CORS"
git push origin development
```

---

### Step 6: Test Production (3 min)

#### 6.1 Test Backend Health
```bash
curl https://medical-app-backend-xxxxx-uc.a.run.app/health
```

Expected:
```json
{"status": "ok", "environment": "production"}
```

#### 6.2 Test Frontend
1. Visit: `https://medicalapp-three.vercel.app`
2. Register a new user
3. Login
4. Create an appointment
5. Upload a file (tests R2)
6. Generate a prescription (tests PDF)

---

### Step 7: Clean Up Render (Optional)

Once Cloud Run is working:

1. Go to Render Dashboard: https://dashboard.render.com
2. Select `prescription-backend` service
3. **Settings** → **Delete Service**
4. Remove `render.yaml` from repository:
```bash
git rm render.yaml
git commit -m "chore: Remove Render config (migrated to Cloud Run)"
git push origin development
```

---

## 📊 Vercel Sharing Clarification

### ❓ Question: "Current Vercel can share URL to external user only one user"

**You're confusing two different things:**

### 1. **Vercel Team Access** (Developers)
- Who can **manage/deploy** in Vercel Dashboard
- **Free Tier:** 1 team member (you)
- **Pro Tier:** Unlimited team members ($20/month)

### 2. **Application Users** (Doctors/Patients)
- Who can **access your deployed app**
- **Free Tier:** ✅ **UNLIMITED** users
- **Pro Tier:** ✅ **UNLIMITED** users

---

## ✅ Your Medical App Users Are UNLIMITED!

```
Your Vercel Setup:
  - Vercel Account: 1 person (YOU) manages deployments
  - App Users: UNLIMITED doctors, patients, staff can access

No Upgrade Needed For:
  ✅ 10 doctors using app daily
  ✅ 100 doctors using app daily
  ✅ 1000 patients using app daily
  ✅ All users are FREE on Vercel
```

### Only Upgrade Vercel Pro If:
- ❌ Multiple **developers** need to deploy
- ❌ You exceed 100 GB bandwidth/month
- ❌ Need advanced analytics

### Your Current Usage Estimate:
```
Users: 50 doctors + 200 patients
Requests: ~10k/month
Bandwidth: ~5 GB/month
Cost: $0 (FREE tier)
```

**You don't need Vercel Pro!** ✅

---

## 🔄 Auto-Deployment Workflow

### After Migration, Your Workflow:

```bash
# Make changes to backend code
cd prescription-management/backend
# ... edit files ...

# Commit and push to development branch
git add .
git commit -m "feat: Add new feature"
git push origin development

# 🤖 Automatic deployment happens:
# 1. GitHub Actions triggers
# 2. Builds Docker image
# 3. Pushes to Google Container Registry
# 4. Deploys to Cloud Run
# 5. Tests health endpoint
# 6. Notifies success

# ⏱️ Total time: 3-5 minutes
# 💰 Cost per deployment: $0 (within free tier)
```

### Same for Frontend:
```bash
# Make changes to frontend code
cd prescription-management/frontend
# ... edit files ...

# Commit and push
git add .
git commit -m "feat: Update UI"
git push origin development

# 🤖 Vercel auto-deploys
# ⏱️ Total time: 1-2 minutes
```

**Exactly the same experience as Render!** ✅

---

## 💰 Cost Comparison

### Current: Render Setup
```
Render Free Tier:
  - Spins down after 15 min inactivity
  - Cold start: 30-60 seconds
  - 512MB RAM
  - Limited build hours

Render Starter ($7/month):
  - Always on
  - 512MB RAM

Render Standard ($21/month):
  - Always on
  - 2GB RAM
```

### New: Cloud Run Setup
```
Cloud Run Pricing:
  - First 2M requests FREE
  - First 360k GB-seconds FREE
  - Scale to zero (no cold starts after first deploy)
  - Up to 4GB RAM

Expected Cost:
  - Development/Testing: $0/month
  - Small clinic (10k requests): $1-2/month
  - Medium clinic (100k requests): $3-5/month
```

**Savings: $2-16/month** ✅

---

## 🎯 Migration Checklist

- [ ] Google Cloud CLI installed
- [ ] Google Cloud project created (`medical-app-prod`)
- [ ] Service account created with key file
- [ ] All GitHub Secrets configured (12 secrets)
- [ ] GitHub Actions workflow committed and pushed
- [ ] Cloud Run deployment successful (check GitHub Actions)
- [ ] Cloud Run URL obtained
- [ ] Vercel `VITE_API_URL` updated
- [ ] Frontend redeployed
- [ ] CORS `BASE_URL` secret updated
- [ ] Backend redeployed with new BASE_URL
- [ ] Health endpoint tested
- [ ] End-to-end app tested (login, appointment, file upload)
- [ ] Render service deleted (optional)
- [ ] `render.yaml` removed from repo (optional)

---

## 🆘 Troubleshooting

### Issue 1: GitHub Actions Fails
**Check:**
- `GCP_SA_KEY` secret is correct JSON format
- Service account has all 3 roles (run.admin, storage.admin, iam.serviceAccountUser)

### Issue 2: CORS Error
**Fix:**
```bash
# Update ALLOWED_ORIGINS secret with your Vercel URL
# Then redeploy
```

### Issue 3: Database Connection Error
**Fix:**
- Ensure `DATABASE_URL` secret includes `?sslmode=require`
- Check Neon database is active

### Issue 4: File Upload Fails
**Fix:**
- Verify Cloudflare R2 secrets are correct
- Check bucket permissions

---

## 📞 Support

- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **GitHub Actions Logs:** GitHub → Actions → Click workflow run
- **Cloud Run Logs:** `gcloud run services logs tail medical-app-backend --region us-central1`

---

## 🎉 Summary

**Migration Changes:**
1. ✅ Same Docker image
2. ✅ Same environment variables
3. ✅ Same auto-deployment experience
4. ✅ Better performance (no cold starts)
5. ✅ Lower cost ($2-5 vs $7-21)
6. ✅ Same Vercel frontend
7. ✅ Same Neon database
8. ✅ Same Cloudflare R2

**Time Required:** 30-45 minutes
**Downtime:** 0 minutes (deploy Cloud Run first, then switch)
**Risk Level:** Low (can keep Render running until Cloud Run verified)

**Questions About Vercel:**
- ✅ **Unlimited app users** on FREE tier
- ✅ No upgrade needed for 100+ doctors
- ✅ Only upgrade Pro if multiple developers need deploy access
