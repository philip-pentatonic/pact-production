# PACT Production Deployment Guide

## Overview
The PACT production system is deployed on Cloudflare's infrastructure:
- **Backend API**: Cloudflare Workers (https://pact-api.philip-134.workers.dev)
- **Frontend Dashboard**: Cloudflare Pages (https://pact-dashboard.pages.dev)
- **Database**: Cloudflare D1 (SQLite)

## Current Status
✅ Backend API deployed and working
✅ Database initialized with seed data
✅ Frontend deployed
✅ Authentication working

## Login Credentials
- **Username**: admin
- **Password**: admin123
- **Email**: admin@pact.com

## Known Issues
1. Frontend needs to be configured with production API URL
2. Some API endpoints may need CORS adjustments

## Manual Deployment Steps

### Backend Deployment
```bash
cd backend
npm run deploy
```

### Frontend Deployment
1. Set the API URL in GitHub Secrets:
   - Go to Settings > Secrets and variables > Actions
   - Add `PRODUCTION_API_URL` = `https://pact-api.philip-134.workers.dev`
   - Add `STAGING_API_URL` = `https://pact-api-staging.philip-134.workers.dev`

2. The frontend will auto-deploy on push to main branch

### Database Management
```bash
# Execute SQL on production database
cd backend
wrangler d1 execute pact-production --remote --file=../database/schema.sql

# Check database
wrangler d1 execute pact-production --remote --command="SELECT * FROM users"
```

## Environment Variables
The following secrets need to be set:

### GitHub Secrets (for CI/CD)
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `JWT_SECRET`
- `G2_UPLOAD_TOKEN`
- `PRODUCTION_API_URL`
- `STAGING_API_URL`

### Cloudflare Worker Secrets
- `JWT_SECRET` (already set)
- `G2_UPLOAD_TOKEN` (already set)

## Monitoring
- View Worker logs: `cd backend && npm run tail`
- Check deployment status in Cloudflare Dashboard

## Next Steps
1. Configure frontend to use production API
2. Set up custom domains
3. Enable analytics
4. Configure backups