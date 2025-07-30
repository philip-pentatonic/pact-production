# CI/CD Setup Guide

This guide explains how to set up continuous integration and deployment for the PACT production system using GitHub Actions and Cloudflare.

## Prerequisites

1. GitHub repository with the PACT code
2. Cloudflare account with Workers and Pages enabled
3. API tokens and secrets configured

## Required Secrets

Configure these secrets in your GitHub repository settings under Settings → Secrets and variables → Actions:

### Cloudflare Secrets
- `CLOUDFLARE_API_TOKEN` - API token with Workers and Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Application Secrets
- `JWT_SECRET` - Secret key for JWT tokens (generate with `openssl rand -base64 32`)
- `G2_UPLOAD_TOKEN` - Token for G2 SFTP integration

### Environment URLs
- `PRODUCTION_API_URL` - Production API URL (e.g., https://api.pact.example.com)
- `STAGING_API_URL` - Staging API URL (e.g., https://api-staging.pact.example.com)

## Workflows

### 1. Deploy Workflow (`deploy.yml`)

Triggers on:
- Push to `main` branch (production deployment)
- Push to `staging` branch (staging deployment)
- Pull requests to `main` (test only)

Steps:
1. Run tests
2. Deploy backend to Cloudflare Workers
3. Build and deploy frontend to Cloudflare Pages
4. Run database migrations (production only)

### 2. Test Workflow (`test.yml`)

Triggers on:
- Pull requests to `main` or `staging`

Steps:
1. Lint backend and frontend code
2. Run unit tests
3. Build verification

## Setting Up Cloudflare

### 1. Create API Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Create a new token with these permissions:
   - Account: Cloudflare Workers Scripts:Edit
   - Account: Cloudflare Pages:Edit
   - Account: D1:Edit
   - Zone: Zone:Read (for custom domains)

### 2. Get Account ID

Find your account ID in the Cloudflare dashboard URL or under any domain's overview page.

### 3. Create D1 Databases

```bash
# Production
wrangler d1 create pact-production

# Staging
wrangler d1 create pact-staging
```

Update the database IDs in `backend/wrangler.toml`.

### 4. Create Pages Project

```bash
wrangler pages project create pact-dashboard
```

## Environment Configuration

### Backend (`wrangler.toml`)

```toml
# Production
[env.production]
name = "pact-api"
vars = { ENVIRONMENT = "production" }

# Staging
[env.staging]
name = "pact-api-staging"
vars = { ENVIRONMENT = "staging" }
```

### Frontend Environment Variables

Set in GitHub Actions:
- Production: `VITE_API_URL=https://api.pact.example.com`
- Staging: `VITE_API_URL=https://api-staging.pact.example.com`

## Deployment Flow

### Production Deployment

1. Merge PR to `main` branch
2. GitHub Actions automatically:
   - Runs all tests
   - Deploys backend to Workers
   - Builds and deploys frontend to Pages
   - Applies database migrations
3. Verify deployment at production URLs

### Staging Deployment

1. Push to `staging` branch
2. GitHub Actions automatically:
   - Runs all tests
   - Deploys to staging environment
3. Test changes at staging URLs

### Rollback Process

If issues occur after deployment:

1. **Immediate Rollback**:
   ```bash
   # List deployments
   wrangler deployments list
   
   # Rollback Workers
   wrangler rollback [deployment-id]
   ```

2. **Code Rollback**:
   - Revert the problematic commit
   - Push to trigger new deployment

3. **Database Rollback**:
   - Create a rollback migration
   - Deploy through normal process

## Monitoring Deployments

### GitHub Actions

Monitor deployment status:
1. Go to repository → Actions tab
2. Click on workflow run to see details
3. Check logs for any errors

### Cloudflare Dashboard

Verify deployments:
1. Workers & Pages → View your projects
2. Check deployment status and metrics
3. View real-time logs with `wrangler tail`

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API token has correct permissions
   - Check token hasn't expired
   - Ensure secrets are properly set in GitHub

2. **Build Failures**
   - Check Node version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

3. **Deployment Failures**
   - Check Cloudflare service status
   - Verify account limits haven't been reached
   - Review wrangler.toml configuration

### Debug Commands

```bash
# Test deployment locally
wrangler deploy --dry-run

# Check Worker logs
wrangler tail

# Verify Pages deployment
wrangler pages deployment list
```

## Best Practices

1. **Always test in staging first**
   - Push changes to staging branch
   - Verify functionality
   - Then merge to main

2. **Use pull requests**
   - All changes through PRs
   - Automated tests must pass
   - Code review before merge

3. **Monitor after deployment**
   - Check error rates
   - Monitor performance metrics
   - Verify critical functionality

4. **Keep secrets secure**
   - Rotate secrets regularly
   - Never commit secrets to code
   - Use GitHub's secret scanning

## Maintenance

### Regular Tasks

- Review and update dependencies monthly
- Rotate API tokens quarterly
- Clean up old deployments
- Monitor GitHub Actions usage/billing

### Updating Workflows

When modifying workflows:
1. Test changes in a feature branch
2. Use `workflow_dispatch` for manual testing
3. Gradually roll out to staging, then production