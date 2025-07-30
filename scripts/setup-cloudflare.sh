#!/bin/bash

# PACT Production - Cloudflare Setup Script
# This script helps set up the Cloudflare resources needed for deployment

set -e

echo "=== PACT Production Cloudflare Setup ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: Wrangler CLI is not installed${NC}"
    echo "Please install it with: npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}You need to login to Cloudflare${NC}"
    wrangler login
fi

echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"
echo ""

# Create D1 Databases
echo "Creating D1 databases..."

# Production database
echo "Creating production database..."
PROD_DB_OUTPUT=$(wrangler d1 create pact-production 2>&1) || {
    if [[ $PROD_DB_OUTPUT == *"already exists"* ]]; then
        echo -e "${YELLOW}Production database already exists${NC}"
    else
        echo -e "${RED}Error creating production database: $PROD_DB_OUTPUT${NC}"
        exit 1
    fi
}

if [[ $PROD_DB_OUTPUT == *"database_id"* ]]; then
    PROD_DB_ID=$(echo "$PROD_DB_OUTPUT" | grep -o '"database_id":\s*"[^"]*"' | sed 's/"database_id":\s*"//' | sed 's/"//')
    echo -e "${GREEN}✓ Production database created${NC}"
    echo "  Database ID: $PROD_DB_ID"
else
    # Try to get existing database ID
    PROD_DB_ID=$(wrangler d1 list | grep "pact-production" | awk '{print $2}')
    echo "  Existing Database ID: $PROD_DB_ID"
fi

# Staging database
echo "Creating staging database..."
STAGING_DB_OUTPUT=$(wrangler d1 create pact-staging 2>&1) || {
    if [[ $STAGING_DB_OUTPUT == *"already exists"* ]]; then
        echo -e "${YELLOW}Staging database already exists${NC}"
    else
        echo -e "${RED}Error creating staging database: $STAGING_DB_OUTPUT${NC}"
        exit 1
    fi
}

if [[ $STAGING_DB_OUTPUT == *"database_id"* ]]; then
    STAGING_DB_ID=$(echo "$STAGING_DB_OUTPUT" | grep -o '"database_id":\s*"[^"]*"' | sed 's/"database_id":\s*"//' | sed 's/"//')
    echo -e "${GREEN}✓ Staging database created${NC}"
    echo "  Database ID: $STAGING_DB_ID"
else
    # Try to get existing database ID
    STAGING_DB_ID=$(wrangler d1 list | grep "pact-staging" | awk '{print $2}')
    echo "  Existing Database ID: $STAGING_DB_ID"
fi

# Development database
echo "Creating development database..."
DEV_DB_OUTPUT=$(wrangler d1 create pact-development 2>&1) || {
    if [[ $DEV_DB_OUTPUT == *"already exists"* ]]; then
        echo -e "${YELLOW}Development database already exists${NC}"
    else
        echo -e "${RED}Error creating development database: $DEV_DB_OUTPUT${NC}"
        exit 1
    fi
}

if [[ $DEV_DB_OUTPUT == *"database_id"* ]]; then
    DEV_DB_ID=$(echo "$DEV_DB_OUTPUT" | grep -o '"database_id":\s*"[^"]*"' | sed 's/"database_id":\s*"//' | sed 's/"//')
    echo -e "${GREEN}✓ Development database created${NC}"
    echo "  Database ID: $DEV_DB_ID"
else
    # Try to get existing database ID
    DEV_DB_ID=$(wrangler d1 list | grep "pact-development" | awk '{print $2}')
    echo "  Existing Database ID: $DEV_DB_ID"
fi

echo ""

# Update wrangler.toml
echo "Updating wrangler.toml with database IDs..."

cd backend

# Backup existing wrangler.toml
cp wrangler.toml wrangler.toml.backup

# Update database IDs
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/YOUR_DATABASE_ID_HERE/$PROD_DB_ID/g" wrangler.toml
    sed -i '' "s/YOUR_DEV_DATABASE_ID_HERE/$DEV_DB_ID/g" wrangler.toml
    sed -i '' "s/YOUR_STAGING_DATABASE_ID_HERE/$STAGING_DB_ID/g" wrangler.toml
else
    # Linux
    sed -i "s/YOUR_DATABASE_ID_HERE/$PROD_DB_ID/g" wrangler.toml
    sed -i "s/YOUR_DEV_DATABASE_ID_HERE/$DEV_DB_ID/g" wrangler.toml
    sed -i "s/YOUR_STAGING_DATABASE_ID_HERE/$STAGING_DB_ID/g" wrangler.toml
fi

echo -e "${GREEN}✓ Updated wrangler.toml${NC}"
echo ""

# Create Pages project
echo "Creating Cloudflare Pages project..."
wrangler pages project create pact-dashboard 2>&1 || {
    echo -e "${YELLOW}Pages project might already exist or will be created on first deployment${NC}"
}

echo ""

# Generate JWT secret
echo "Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ Generated JWT secret${NC}"
echo ""

# Set up secrets
echo "Setting up secrets..."
echo ""
echo -e "${YELLOW}You'll need to set the following secrets:${NC}"
echo ""
echo "For local development:"
echo "  wrangler secret put JWT_SECRET --env development"
echo "  (Use this value: $JWT_SECRET)"
echo ""
echo "For staging:"
echo "  wrangler secret put JWT_SECRET --env staging"
echo "  wrangler secret put G2_UPLOAD_TOKEN --env staging"
echo ""
echo "For production:"
echo "  wrangler secret put JWT_SECRET"
echo "  wrangler secret put G2_UPLOAD_TOKEN"
echo ""

# Create .dev.vars for local development
echo "JWT_SECRET=$JWT_SECRET" > .dev.vars
echo "G2_UPLOAD_TOKEN=dev-token-change-in-production" >> .dev.vars
echo -e "${GREEN}✓ Created .dev.vars for local development${NC}"

cd ..

echo ""
echo "=== Setup Summary ==="
echo ""
echo "Database IDs have been configured in backend/wrangler.toml:"
echo "  Production: $PROD_DB_ID"
echo "  Staging: $STAGING_DB_ID"
echo "  Development: $DEV_DB_ID"
echo ""
echo "JWT Secret has been generated and saved to backend/.dev.vars"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. cd backend"
echo "2. npm install"
echo "3. Run database migrations:"
echo "   npm run db:init:local"
echo "   npm run db:migrate -- --local"
echo "   npm run db:seed -- --local"
echo "4. Create admin user:"
echo "   node scripts/init-admin.js"
echo "5. Start development server:"
echo "   npm run dev"
echo ""
echo -e "${GREEN}Setup complete!${NC}"