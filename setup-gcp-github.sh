#!/bin/bash

# Google Cloud Setup for GitHub Actions Auto-Deployment
# This script automates the GCP setup for Cloud Run deployment

set -e

echo "🚀 Setting up Google Cloud for GitHub Actions Deployment"
echo ""

# Configuration
DEFAULT_PROJECT_ID="medical-app-prod"
SERVICE_ACCOUNT_NAME="github-actions"
KEY_FILE="$HOME/gcp-key.json"

# Step 1: Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not installed"
    echo "Install: brew install --cask google-cloud-sdk"
    exit 1
fi

echo "✅ gcloud CLI found"
echo ""

# Step 2: Get project ID
read -p "Enter Google Cloud Project ID [$DEFAULT_PROJECT_ID]: " PROJECT_ID
PROJECT_ID="${PROJECT_ID:-$DEFAULT_PROJECT_ID}"

echo ""
echo "📦 Setting up project: $PROJECT_ID"
echo ""

# Step 3: Login to Google Cloud
echo "🔐 Logging in to Google Cloud..."
gcloud auth login

# Step 4: Create project (if needed)
echo ""
echo "Creating project (if it doesn't exist)..."
if gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo "✅ Project already exists: $PROJECT_ID"
else
    gcloud projects create $PROJECT_ID --name="Medical App Production"
    echo "✅ Project created: $PROJECT_ID"
fi

# Step 5: Set active project
echo ""
echo "Setting active project..."
gcloud config set project $PROJECT_ID

# Step 6: Enable required APIs
echo ""
echo "🔧 Enabling required APIs (this may take a minute)..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
echo "✅ APIs enabled"

# Step 7: Create service account
echo ""
echo "👤 Creating service account for GitHub Actions..."
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
    echo "✅ Service account already exists"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
      --display-name="GitHub Actions Deployment"
    echo "✅ Service account created"
fi

# Step 8: Grant permissions
echo ""
echo "🔑 Granting permissions to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

echo "✅ Permissions granted"

# Step 9: Create key file
echo ""
echo "🔐 Creating service account key file..."
if [ -f "$KEY_FILE" ]; then
    echo "⚠️  Key file already exists: $KEY_FILE"
    read -p "Overwrite? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "Using existing key file"
    else
        rm "$KEY_FILE"
        gcloud iam service-accounts keys create "$KEY_FILE" \
          --iam-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
        echo "✅ New key file created"
    fi
else
    gcloud iam service-accounts keys create "$KEY_FILE" \
      --iam-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    echo "✅ Key file created: $KEY_FILE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Google Cloud Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Add GitHub Secrets to your repository:"
echo "   GitHub → Settings → Secrets and variables → Actions → New secret"
echo ""
echo "2. Add this secret:"
echo "   Name: GCP_SA_KEY"
echo "   Value: (Copy entire content of $KEY_FILE)"
echo ""
echo "   To copy key content to clipboard (macOS):"
echo "   cat $KEY_FILE | pbcopy"
echo ""
echo "3. Generate JWT and App secrets:"
echo "   python3 -c \"import secrets; print('JWT_SECRET_KEY:', secrets.token_urlsafe(32))\""
echo "   python3 -c \"import secrets; print('SECRET_KEY:', secrets.token_urlsafe(32))\""
echo ""
echo "4. Add remaining GitHub Secrets:"
echo "   - DATABASE_URL (from Neon)"
echo "   - JWT_SECRET_KEY (generated above)"
echo "   - SECRET_KEY (generated above)"
echo "   - ALLOWED_ORIGINS (your Vercel URL)"
echo "   - CLOUDFLARE_R2_ACCESS_KEY"
echo "   - CLOUDFLARE_R2_SECRET_KEY"
echo "   - CLOUDFLARE_R2_ENDPOINT"
echo "   - CLOUDFLARE_R2_PUBLIC_URL"
echo "   - OPENAI_API_KEY (optional)"
echo "   - BASE_URL (will update after first deploy)"
echo ""
echo "5. Push GitHub Actions workflow:"
echo "   git add .github/workflows/deploy-cloudrun.yml"
echo "   git commit -m \"feat: Add Cloud Run auto-deployment\""
echo "   git push origin development"
echo ""
echo "6. Monitor deployment:"
echo "   GitHub → Actions → Watch deployment progress"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Keep $KEY_FILE secure and NEVER commit to git!"
echo ""
