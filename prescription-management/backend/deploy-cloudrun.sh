#!/bin/bash

# Google Cloud Run Deployment Script
# Medical App Backend - Hybrid Deployment
# Usage: ./deploy-cloudrun.sh

set -e

echo "🚀 Deploying Medical App Backend to Google Cloud Run..."
echo ""

# Configuration
PROJECT_ID="medical-app-prod"
SERVICE_NAME="medical-app-backend"
REGION="us-central1"
MEMORY="512Mi"
CPU="1"
TIMEOUT="300"
MAX_INSTANCES="10"
MIN_INSTANCES="0"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "Please create .env.production with required environment variables"
    echo "See GOOGLE_CLOUD_RUN_DEPLOYMENT.md for details"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not installed"
    echo "Install: brew install --cask google-cloud-sdk"
    exit 1
fi

# Prompt for project ID if different
read -p "Enter Google Cloud Project ID [$PROJECT_ID]: " input_project
PROJECT_ID="${input_project:-$PROJECT_ID}"

# Set project
echo "📦 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Confirm deployment
echo ""
echo "Deployment Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Memory: $MEMORY"
echo "  CPU: $CPU"
echo "  Max Instances: $MAX_INSTANCES"
echo "  Min Instances: $MIN_INSTANCES (scale to zero)"
echo ""
read -p "Continue with deployment? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🏗️  Building and deploying to Cloud Run..."
echo "This may take 3-5 minutes..."
echo ""

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory $MEMORY \
  --cpu $CPU \
  --timeout $TIMEOUT \
  --max-instances $MAX_INSTANCES \
  --min-instances $MIN_INSTANCES \
  --port 8000 \
  --env-vars-file .env.production \
  --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment successful!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Backend URL: $SERVICE_URL"
echo "📊 API Docs:    $SERVICE_URL/docs"
echo "❤️  Health:     $SERVICE_URL/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update Frontend Environment Variable:"
echo "   VITE_API_URL=$SERVICE_URL/api/v1"
echo ""
echo "2. Update CORS Configuration:"
echo "   Add your Vercel domain to ALLOWED_ORIGINS in .env.production"
echo "   Then re-deploy: ./deploy-cloudrun.sh"
echo ""
echo "3. Test Health Endpoint:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "4. View Logs:"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
echo "5. Monitor Metrics:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
