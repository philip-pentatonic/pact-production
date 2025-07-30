# PACT Production System - Project Overview

## Introduction

The PACT (Partners for Advanced Circular Technologies) system is a specialized recycling management platform designed to track and analyze beauty product recycling across retail partners. This production version is a streamlined, single-tenant implementation extracted from the Pentatonic demo environment.

## Architecture

### Technology Stack

**Backend:**
- Cloudflare Workers (serverless compute)
- Cloudflare D1 (SQLite database)
- Hono (web framework)
- Zod (validation)
- JWT (authentication)

**Frontend:**
- React 18
- Vite (build tool)
- TailwindCSS (styling)
- React Query (data fetching)
- Clerk (authentication)
- Chart.js/Recharts (analytics)

**Infrastructure:**
- Cloudflare Workers & Pages
- Cloudflare D1 Database
- Cloudflare CDN

### System Components

```
pact-production/
├── backend/           # API server (Cloudflare Worker)
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── utils/    # Helper functions
│   │   └── middleware/
│   └── scripts/      # Database management
├── frontend/         # React dashboard
│   └── src/
│       ├── pages/    # Route components
│       ├── components/
│       ├── hooks/    # Custom React hooks
│       └── services/ # API clients
├── database/         # Schema and migrations
└── docs/            # Documentation
```

## Key Features

### 1. Shipment Management
- Import and process recycling data from G2 SFTP
- Track packages through the recycling pipeline
- Material categorization and contamination tracking
- Weight-based analytics

### 2. Member & Store Management
- Retail partner profiles (Kiehl's, Sephora, etc.)
- Store location tracking
- Performance metrics by member/store

### 3. Analytics & Reporting
- Real-time dashboards
- Material breakdown reports
- Contamination rate analysis
- Time-based trends
- CSV export functionality

### 4. G2 Integration
- Automated SFTP file processing
- Material mapping configuration
- Batch import with error handling
- Reprocessing capabilities

## Data Model

### Core Entities

1. **Members** - Retail partners (Kiehl's, Sephora, etc.)
2. **Stores** - Physical locations for each member
3. **Shipments** - Individual recycling records
4. **Materials** - Categorized materials with contamination tracking
5. **Users** - System users with role-based access

### Key Business Rules

- **Weight Validation**: 40 lbs max for retail, 50,000 lbs for bulk programs
- **Material Mapping**: Current materials mapped to dashboard categories
- **Contamination Split**: Non-Beauty Items vs Contaminated Beauty Items
- **Zero Weight Filter**: Records with 0 weight are excluded
- **Unique ID Generation**: Auto-generated for pre-2024 data

## API Endpoints

### Public Endpoints
- `GET /health` - System health check
- `POST /api/auth/login` - User authentication

### Protected Endpoints (require auth)
- `GET /api/shipments` - List shipments with filters
- `GET /api/members` - List retail partners
- `GET /api/reports/*` - Analytics endpoints
- `POST /api/g2/upload` - Process G2 files

## User Roles

1. **Super Admin** - Full system access
2. **Admin** - Member management, reports
3. **Operator** - Data entry, basic reports
4. **Viewer** - Read-only access

## Development Workflow

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev  # Starts on :8787

# Frontend  
cd frontend
npm install
npm run dev  # Starts on :3000
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Check database
wrangler d1 execute pact-development --local --command "SELECT * FROM members"
```

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Deployment

The system uses a three-tier deployment strategy:

1. **Development** - Local testing
2. **Staging** - Pre-production validation
3. **Production** - Live system

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Data Import Process

### G2 File Processing

1. Files uploaded via SFTP to G2 system
2. PACT API receives file via POST to `/api/g2/upload`
3. System validates and processes records:
   - Filters zero-weight records
   - Maps materials to categories
   - Calculates contamination rates
   - Groups packages by barcode
4. Results stored in `pact_shipments` table
5. Analytics updated automatically

### Manual Import

For historical data or corrections:

```bash
cd backend
node scripts/import-data.js --file=data.csv --batch=2025Q1
```

## Monitoring & Maintenance

### Health Checks
- `/health` - Basic API status
- `/health/detailed` - Database and table checks
- `/health/ready` - Deployment readiness

### Key Metrics
- Total packages processed
- Contamination rates by member
- Material distribution
- Processing times

### Regular Maintenance
- Weekly: Review error logs, check performance
- Monthly: Update dependencies, backup database
- Quarterly: Security audit, capacity planning

## Security Considerations

- JWT-based authentication
- Role-based access control
- Parameterized SQL queries
- CORS configuration for known domains
- Secrets managed via Wrangler
- HTTPS enforced on all endpoints

## Migration from Demo

This system was extracted from the multi-tenant Pentatonic demo with:
- Removed tenant switching logic
- Simplified authentication flow
- PACT-specific business rules
- Streamlined database schema
- Focused reporting features

## Future Enhancements

1. **Automated Reporting** - Scheduled email reports
2. **Advanced Analytics** - ML-based contamination prediction
3. **Mobile App** - Field scanning application
4. **API Integration** - Direct partner system integration
5. **Blockchain Tracking** - Immutable recycling certificates

## Support & Contact

- Technical Issues: Create GitHub issue
- Urgent Support: Contact DevOps team
- Documentation: See `/docs` directory
- API Reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)