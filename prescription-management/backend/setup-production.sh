#!/bin/bash

# Production Environment Setup Script
# Generates secure secrets and prepares .env.production
# Usage: ./setup-production.sh

set -e

echo "🔐 Setting up Production Environment for Google Cloud Run"
echo ""

# Check if .env.production already exists
if [ -f .env.production ]; then
    echo "⚠️  Warning: .env.production already exists"
    read -p "Overwrite? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "❌ Setup cancelled"
        exit 0
    fi
    echo ""
fi

# Generate secrets
echo "🔑 Generating secure secrets..."
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
APP_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

echo "✅ Secrets generated"
echo ""

# Collect required information
echo "📝 Please provide the following information:"
echo ""

# Neon Database
read -p "Neon PostgreSQL DATABASE_URL: " database_url

# Cloudflare R2
read -p "Cloudflare R2 Access Key: " r2_access_key
read -p "Cloudflare R2 Secret Key: " r2_secret_key
read -p "Cloudflare R2 Bucket Name [dental-attachments]: " r2_bucket
r2_bucket="${r2_bucket:-dental-attachments}"
read -p "Cloudflare R2 Endpoint URL: " r2_endpoint
read -p "Cloudflare R2 Public URL: " r2_public_url

# Vercel domain
read -p "Vercel Frontend URL (e.g., https://app.vercel.app): " vercel_url

# OpenAI (optional)
read -p "OpenAI API Key (optional, press Enter to skip): " openai_key

echo ""
echo "📄 Creating .env.production file..."

# Create .env.production
cat > .env.production << EOF
# Production Environment Configuration
# Generated on: $(date)

# ============================================================================
# ENVIRONMENT
# ============================================================================
ENVIRONMENT=production
DEBUG=False

# ============================================================================
# DATABASE (Neon PostgreSQL)
# ============================================================================
DATABASE_URL=$database_url

# ============================================================================
# SECURITY
# ============================================================================
JWT_SECRET_KEY=$JWT_SECRET
SECRET_KEY=$APP_SECRET

# ============================================================================
# CORS
# ============================================================================
ALLOWED_ORIGINS=["$vercel_url","http://localhost:5173"]

# ============================================================================
# CLOUDFLARE R2 STORAGE
# ============================================================================
CLOUD_STORAGE_PROVIDER=cloudflare
CLOUDFLARE_R2_ACCESS_KEY=$r2_access_key
CLOUDFLARE_R2_SECRET_KEY=$r2_secret_key
CLOUDFLARE_R2_BUCKET=$r2_bucket
CLOUDFLARE_R2_ENDPOINT=$r2_endpoint
CLOUDFLARE_R2_PUBLIC_URL=$r2_public_url

# ============================================================================
# OPENAI (Optional)
# ============================================================================
EOF

if [ -n "$openai_key" ]; then
    cat >> .env.production << EOF
OPENAI_API_KEY=$openai_key
OPENAI_MODEL=gpt-4o-mini
EOF
else
    cat >> .env.production << EOF
# OPENAI_API_KEY=
# OPENAI_MODEL=gpt-4o-mini
EOF
fi

cat >> .env.production << EOF

# ============================================================================
# BASE URL (Update after first deployment)
# ============================================================================
BASE_URL=https://medical-app-backend-xxxxx.run.app

# ============================================================================
# FILE UPLOAD
# ============================================================================
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=["pdf","jpg","jpeg","png","dcm","dicom"]

# ============================================================================
# JWT EXPIRATION
# ============================================================================
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ============================================================================
# AUDIT LOGGING
# ============================================================================
ENABLE_AUDIT_LOGGING=True
AUDIT_LOG_RETENTION_DAYS=2555
EOF

echo "✅ .env.production created successfully!"
echo ""
echo "🔒 Security Notes:"
echo "  - .env.production contains sensitive credentials"
echo "  - Never commit this file to git"
echo "  - File is already in .gitignore"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Review .env.production and verify all values"
echo "2. Run database migrations:"
echo "   export DATABASE_URL=\"$database_url\""
echo "   alembic upgrade head"
echo ""
echo "3. Deploy to Google Cloud Run:"
echo "   ./deploy-cloudrun.sh"
echo ""
echo "4. After deployment, update BASE_URL in .env.production with your Cloud Run URL"
echo "   Then re-deploy: ./deploy-cloudrun.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Generated Secrets (save these securely):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "JWT_SECRET_KEY: $JWT_SECRET"
echo "SECRET_KEY: $APP_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
