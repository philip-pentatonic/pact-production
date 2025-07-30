#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you set up the required GitHub secrets for deployment

echo "=== GitHub Secrets Setup ==="
echo ""
echo "This script will help you set up the required GitHub secrets."
echo "You'll need to have already created a Cloudflare API token."
echo ""

# Set default values
CLOUDFLARE_ACCOUNT_ID="13432f0a5c59f448e14499d223a1d7c4"
JWT_SECRET="KcG/bLN2sH/oqpUn4XL+abTsHJkfhVxNOlohHZb4Wfw="
G2_UPLOAD_TOKEN="e588b0504a643ce423f76647770049083d2b75da688ab1132b64448bed79163e"

# Prompt for API token
echo "Enter your Cloudflare API Token (from https://dash.cloudflare.com/profile/api-tokens):"
read -s CLOUDFLARE_API_TOKEN
echo ""

# Prompt for API URLs
echo "Enter the production API URL (e.g., https://api-pact.example.com):"
read PRODUCTION_API_URL
echo ""

echo "Enter the staging API URL (e.g., https://api-staging-pact.example.com):"
read STAGING_API_URL
echo ""

# Set the secrets
echo "Setting GitHub secrets..."

gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID"
gh secret set JWT_SECRET --body "$JWT_SECRET"
gh secret set G2_UPLOAD_TOKEN --body "$G2_UPLOAD_TOKEN"
gh secret set PRODUCTION_API_URL --body "$PRODUCTION_API_URL"
gh secret set STAGING_API_URL --body "$STAGING_API_URL"

echo ""
echo "✅ GitHub secrets have been set!"
echo ""
echo "You can view them at: https://github.com/philip-pentatonic/pact-production/settings/secrets/actions"
echo ""
echo "Next steps:"
echo "1. The staging deployment will trigger automatically"
echo "2. To deploy to production, merge staging into main"
echo ""