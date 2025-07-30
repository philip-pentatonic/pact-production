# PACT Production Deployment Guide

## Overview
This guide covers deploying the PACT recycling management system to production using Cloudflare Workers (backend) and Cloudflare Pages (frontend).

## Prerequisites

1. **Cloudflare Account** with Workers and Pages enabled
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Node.js 18+** and npm/yarn
4. **Git** for version control
5. **Domain** configured in Cloudflare (e.g., pact.example.com)

## Backend Deployment

### 1. Database Setup

First, create the D1 databases for each environment:

```bash
# Create production database
wrangler d1 create pact-production

# Create staging database  
wrangler d1 create pact-staging

# Create development database
wrangler d1 create pact-development
```

Save the database IDs returned by these commands.

### 2. Update Configuration

Edit `backend/wrangler.toml` with your database IDs:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pact-production"
database_id = "YOUR_PRODUCTION_DB_ID"

[env.staging.d1_databases]
binding = "DB"
database_name = "pact-staging"
database_id = "YOUR_STAGING_DB_ID"
```

### 3. Set Secrets

Configure sensitive environment variables:

```bash
cd backend

# Production secrets
wrangler secret put JWT_SECRET
# Generate a secure secret: openssl rand -base64 32
wrangler secret put G2_UPLOAD_TOKEN

# Staging secrets
wrangler secret put JWT_SECRET --env staging
wrangler secret put G2_UPLOAD_TOKEN --env staging
```

### 4. Initialize Database

Run migrations and seed data:

```bash
# Initialize production database
npm run db:init
npm run db:migrate
npm run db:seed

# Initialize staging database
npm run db:init --env staging
npm run db:migrate --env staging
npm run db:seed --env staging
```

### 5. Create Initial Admin User

Create the first admin user for system access:

```bash
# Run the admin initialization script
node scripts/init-admin.js

# Follow the prompts to create admin user
# Then apply the generated SQL:
wrangler d1 execute pact-production --file=database/create-admin.sql

# For staging:
wrangler d1 execute pact-staging --file=database/create-admin.sql
```

**Important**: The seed data includes demo users with default passwords. In production, you should:
1. Create a proper admin user using the init-admin script
2. Delete or disable the demo users
3. Enforce strong password policies

### 6. Deploy Backend

```bash
# Deploy to staging first
npm run deploy:staging

# Test staging deployment
curl https://api-staging.pact.example.com/health

# Deploy to production
npm run deploy:production
```

## Frontend Deployment

### 1. Environment Variables

Create `.env.production` in the frontend directory:

```env
VITE_API_URL=https://api.pact.example.com
```

### 2. Build Frontend

```bash
cd frontend
npm install
npm run build
```

### 3. Deploy to Cloudflare Pages

#### Option A: Via Wrangler

```bash
# Install Pages plugin
npm install -D @cloudflare/pages-action

# Deploy
wrangler pages deploy dist --project-name=pact-dashboard
```

#### Option B: Via Dashboard

1. Go to Cloudflare Dashboard > Pages
2. Create a new project
3. Connect your Git repository
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`
5. Add environment variables
6. Deploy

### 4. Configure Custom Domain

1. In Cloudflare Pages settings, add custom domain
2. Configure DNS records:
   ```
   pact.example.com -> Pages project
   api.pact.example.com -> Workers route
   ```

## CI/CD Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy PACT

on:
  push:
    branches: [main, staging]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
        
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: ./backend
          command: deploy --env ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
        
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ github.ref == 'refs/heads/main' && 'https://api.pact.example.com' || 'https://api-staging.pact.example.com' }}
          
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: pact-dashboard
          directory: ./frontend/dist
          branch: ${{ github.ref == 'refs/heads/main' && 'main' || 'staging' }}
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check API health
curl https://api.pact.example.com/health/detailed

# Check frontend
open https://pact.example.com
```

### 2. Configure Monitoring

Set up Cloudflare Analytics and Workers Analytics to monitor:
- Request rates
- Error rates
- Performance metrics
- Database query performance

### 3. Set Up Alerts

Configure alerts in Cloudflare for:
- High error rates
- Slow response times
- Database connection issues

### 4. Configure Backups

Set up automated D1 database backups:

```bash
# Create backup
wrangler d1 backup create pact-production

# List backups
wrangler d1 backup list pact-production
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database ID in wrangler.toml
   - Check D1 database exists: `wrangler d1 list`
   - Ensure migrations ran successfully

2. **Authentication Failures**
   - Verify Clerk keys are set correctly
   - Check JWT_SECRET matches between environments
   - Ensure CORS origins are configured

3. **Build Failures**
   - Check Node version compatibility
   - Clear cache and reinstall dependencies
   - Verify environment variables are set

### Debug Commands

```bash
# View Worker logs
wrangler tail

# Check D1 database
wrangler d1 execute pact-production --command "SELECT COUNT(*) FROM pact_shipments"

# Test API endpoints
curl -X GET https://api.pact.example.com/api/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Checklist

- [ ] All secrets are stored in Wrangler secrets, not in code
- [ ] JWT_SECRET is properly generated and secure
- [ ] Default/demo users are removed in production
- [ ] Admin passwords are strong and unique
- [ ] CORS is properly configured for production domains
- [ ] Rate limiting is enabled on API endpoints
- [ ] Database queries use parameterized statements
- [ ] Authentication is required on all sensitive endpoints
- [ ] HTTPS is enforced on all domains
- [ ] Environment variables don't contain sensitive data
- [ ] Password hashing uses secure algorithms (PBKDF2)

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check database growth
   - Monitor performance metrics

2. **Monthly**
   - Update dependencies
   - Review and rotate secrets
   - Backup database

3. **Quarterly**
   - Security audit
   - Performance optimization
   - Capacity planning

## Rollback Procedure

If issues arise after deployment:

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]

# For Pages, use the dashboard to rollback
```

## Support

For issues or questions:
- Check Worker logs: `wrangler tail`
- Review Cloudflare status page
- Contact PACT DevOps team