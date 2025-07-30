# PACT Production Setup Guide

This guide walks you through setting up the PACT production system from scratch.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Cloudflare account
- GitHub account (for CI/CD)
- Terminal/Command line access

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/pact-production.git
cd pact-production

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 2: Cloudflare Setup

Run the automated setup script:

```bash
./scripts/setup-cloudflare.sh
```

This script will:
1. Check Wrangler authentication
2. Create D1 databases (production, staging, development)
3. Update wrangler.toml with database IDs
4. Generate JWT secret
5. Create local development variables

### Manual Cloudflare Setup (if script fails)

1. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

2. **Create Databases**
   ```bash
   wrangler d1 create pact-production
   wrangler d1 create pact-staging
   wrangler d1 create pact-development
   ```

3. **Update wrangler.toml**
   Replace the database IDs in `backend/wrangler.toml` with the IDs from the create commands.

4. **Generate JWT Secret**
   ```bash
   openssl rand -base64 32
   ```

## Step 3: Database Initialization

```bash
cd backend

# Initialize local database schema
wrangler d1 execute pact-development --local --file=../database/schema.sql

# Run migrations
node scripts/migrate.js --local

# Seed initial data
node scripts/seed.js --local
```

## Step 4: Create Admin User

```bash
# Still in backend directory
node scripts/init-admin.js

# Follow the prompts:
# - Username: admin (or your choice)
# - Email: admin@yourcompany.com
# - First name: Your first name
# - Last name: Your last name
# - Password: Choose a strong password

# Apply the generated SQL
wrangler d1 execute pact-development --local --file=../database/create-admin.sql
```

## Step 5: Environment Configuration

### Backend (.dev.vars)

The setup script creates `backend/.dev.vars` with:
```
JWT_SECRET=<generated-secret>
G2_UPLOAD_TOKEN=dev-token-change-in-production
```

### Frontend (.env.local)

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8787
```

## Step 6: Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server starts at http://localhost:8787
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Server starts at http://localhost:3000
```

## Step 7: Verify Installation

1. **Check API Health**
   ```bash
   curl http://localhost:8787/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Login to Dashboard**
   - Open http://localhost:3000
   - Login with the admin credentials you created
   - You should see the dashboard

## Step 8: GitHub Repository Setup

1. **Create GitHub Repository**
   - Go to GitHub and create a new repository
   - Name: `pact-production`
   - Keep it private

2. **Add Remote and Push**
   ```bash
   git add .
   git commit -m "Initial commit: PACT production system"
   git remote add origin https://github.com/your-org/pact-production.git
   git branch -M main
   git push -u origin main
   ```

3. **Create Staging Branch**
   ```bash
   git checkout -b staging
   git push -u origin staging
   git checkout main
   ```

## Step 9: GitHub Secrets Configuration

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

1. **CLOUDFLARE_API_TOKEN**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create token with Workers and Pages permissions
   - Copy and save as secret

2. **CLOUDFLARE_ACCOUNT_ID**
   - Find in Cloudflare dashboard URL or Overview page
   - Format: 32 character string

3. **JWT_SECRET**
   - Use the same secret generated during setup
   - Or generate new: `openssl rand -base64 32`

4. **G2_UPLOAD_TOKEN**
   - Generate a secure token for G2 uploads
   - Example: `openssl rand -hex 32`

5. **PRODUCTION_API_URL**
   - Your production API URL
   - Example: `https://api.pact.example.com`

6. **STAGING_API_URL**
   - Your staging API URL
   - Example: `https://api-staging.pact.example.com`

## Step 10: Production Deployment

### Set Production Secrets

```bash
cd backend

# Set production secrets
wrangler secret put JWT_SECRET
# Enter the JWT secret when prompted

wrangler secret put G2_UPLOAD_TOKEN
# Enter the G2 token when prompted
```

### Initialize Production Database

```bash
# Initialize schema
wrangler d1 execute pact-production --file=../database/schema.sql

# Run migrations
node scripts/migrate.js --env production

# Create production admin user
node scripts/init-admin.js
# Use strong credentials!

# Apply admin user
wrangler d1 execute pact-production --file=../database/create-admin.sql
```

### Deploy to Production

```bash
# Deploy backend
cd backend
npm run deploy:production

# Frontend will deploy automatically via GitHub Actions
# Or manually:
cd ../frontend
npm run build
wrangler pages deploy dist --project-name=pact-dashboard
```

## Troubleshooting

### Database Connection Issues

If you get "D1_ERROR" or similar:
1. Check database IDs in wrangler.toml
2. Ensure you're using `--local` flag for local development
3. Try deleting `.wrangler/state` and reinitializing

### Authentication Issues

If login fails:
1. Check JWT_SECRET is set correctly
2. Verify user was created in database
3. Check browser console for errors

### Port Conflicts

If ports are already in use:
1. Backend: Change port in `wrangler.toml` dev settings
2. Frontend: Change port in `vite.config.js`

### Build Errors

1. Ensure Node.js 18+ is installed
2. Delete `node_modules` and reinstall
3. Check for TypeScript/ESLint errors

## Next Steps

1. **Configure Custom Domains**
   - Set up domains in Cloudflare
   - Update CORS settings

2. **Set Up Monitoring**
   - Enable Cloudflare Analytics
   - Set up error tracking

3. **Configure Backups**
   - Schedule D1 backups
   - Set up data export jobs

4. **Security Hardening**
   - Review and update security headers
   - Enable rate limiting
   - Set up WAF rules

## Support

For issues or questions:
- Check logs: `wrangler tail`
- Review documentation in `/docs`
- Contact: support@yourcompany.com