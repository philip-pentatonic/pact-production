# PACT Production - Isolated Infrastructure

**Last Updated**: August 10, 2025

## Overview

PACT production is now completely isolated from the demo environment with its own dedicated infrastructure.

## Infrastructure Details

### Database
- **Name**: pact-production-isolated
- **ID**: 72ae02ed-8e13-4c51-b1f7-c30e449786be
- **Type**: Cloudflare D1
- **Region**: WEUR
- **Size**: ~40MB
- **Records**: 120,470 shipments
- **Total Weight**: 678,743.52 lbs (exact match with CSV)

### API
- **URL**: https://pact-api.philip-134.workers.dev
- **Type**: Cloudflare Workers
- **Authentication**: JWT-based
- **Version**: Latest deployment

### Frontend
- **URL**: https://pact-admin.pages.dev (custom domain pending)
- **Deployment**: https://ab586bc7.pact-dashboard.pages.dev
- **Type**: Cloudflare Pages
- **Framework**: React + Vite

## Authentication

### Admin Login
- **Email**: admin@pact.com
- **Password**: admin123
- **Role**: super_admin

### JWT Configuration
- Tokens expire in 24 hours
- Secret stored in Cloudflare Workers secrets
- PBKDF2 password hashing

## Development

### Local Setup
```bash
# Backend
cd backend
npm install
npm run dev  # Runs on http://localhost:8787

# Frontend
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

### Environment Variables

#### Backend (wrangler.toml)
```toml
[[d1_databases]]
binding = "DB"
database_name = "pact-production-isolated"
database_id = "72ae02ed-8e13-4c51-b1f7-c30e449786be"
```

#### Frontend (.env.production)
```env
VITE_API_URL=https://pact-api.philip-134.workers.dev
VITE_DEMO_MODE=false
VITE_ENABLE_EXPORTS=true
VITE_ENABLE_API_KEYS=true
VITE_ENABLE_INVITES=true
```

## Deployment

### Backend
```bash
cd backend
wrangler deploy  # Deploys to production
```

### Frontend
```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=pact-dashboard
```

### Secrets Management
```bash
# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put G2_UPLOAD_TOKEN
```

## Data Structure

### Key Tables
- **members**: 19 PACT beauty brands
- **stores**: 979 locations
- **pact_shipments**: 120,470 records (678,743.52 lbs)
- **users**: Authentication and user management
- **program_types**: Recycling program definitions

### PACT Members
- Ilia Beauty
- Ritual
- Sephora
- Kiehl's
- Credo Beauty
- Beautycounter
- Nordstrom
- L'Occitane
- Glow Recipe
- And more...

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info
- `POST /api/auth/logout` - Logout

### Data Access
- `GET /api/members` - List all members
- `GET /api/shipments` - Query shipments with filters
- `GET /api/analytics/summary` - Analytics dashboard data
- `GET /api/reports/export` - Export data

### G2 Integration
- `POST /api/g2/upload` - G2 data upload (HTTP-based)
- `GET /api/g2/status` - Integration status

## Migration History

### From Shared to Isolated (August 10, 2025)
1. Created new D1 database
2. Migrated all 120,470 records
3. Verified exact weight match (678,743.52 lbs)
4. Updated API configuration
5. Deployed isolated infrastructure
6. Created admin user
7. Tested all endpoints

### Data Integrity
- Source: Shared demo database
- Migration: 100% complete
- Verification: Exact match with CSV data
- No data loss

## Monitoring

### Health Check
```bash
curl https://pact-api.philip-134.workers.dev/health
```

### Database Status
```bash
wrangler d1 execute pact-production-isolated --remote \
  --command="SELECT COUNT(*) as records, ROUND(SUM(weight_lbs), 2) as total_weight FROM pact_shipments"
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check JWT_SECRET is set
   - Verify token expiration
   - Ensure correct password hash format (PBKDF2)

2. **Database Connection**
   - Verify database ID in wrangler.toml
   - Check D1 binding name is "DB"
   - Ensure tables exist

3. **CORS Errors**
   - Frontend URL must be in CORS whitelist
   - Check API URL configuration

## Future Enhancements

1. **Custom Domain** - Setup pact.example.com
2. **Automated Backups** - D1 backup strategy
3. **Monitoring** - Datadog/Sentry integration
4. **CI/CD** - GitHub Actions pipeline
5. **G2 HTTP Integration** - Complete HTTP-based updates

## Support

For issues or questions:
1. Check deployment logs: `wrangler tail`
2. Database queries: Use wrangler d1 execute
3. Frontend console: Check browser DevTools

## Important Notes

- This is now completely separate from the demo environment
- The demo environment still contains PACT data for sales demos
- All production changes should be made in this repository
- Do not use shared database IDs or configurations