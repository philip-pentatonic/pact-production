# PACT Production System

A streamlined recycling management platform for beauty product take-back programs.

## Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account with Workers/Pages enabled
- Wrangler CLI: `npm install -g wrangler`

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/pact-production.git
cd pact-production

# Install dependencies
npm install

# Start backend (http://localhost:8787)
cd backend
npm run dev

# In another terminal, start frontend (http://localhost:3000)
cd frontend
npm run dev
```

### Initial Setup

1. **Configure Wrangler**
   ```bash
   wrangler login
   ```

2. **Create D1 Database**
   ```bash
   cd backend
   wrangler d1 create pact-development
   # Copy the database ID to wrangler.toml
   ```

3. **Initialize Database**
   ```bash
   npm run db:init:local
   npm run db:migrate -- --local
   npm run db:seed -- --local
   ```

4. **Set Environment Variables**
   ```bash
   # Frontend (.env.local)
   VITE_API_URL=http://localhost:8787

   # Backend (wrangler.toml or secrets)
   wrangler secret put JWT_SECRET --local
   # Generate secret: openssl rand -base64 32
   ```

5. **Create Admin User**
   ```bash
   # Run initialization script
   cd backend
   node scripts/init-admin.js
   
   # Or use demo credentials (development only):
   # Username: admin / Password: admin123
   # Username: demo / Password: demo123
   ```

## Project Structure

```
pact-production/
├── backend/                 # Cloudflare Worker API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, error handling
│   │   └── utils/          # Helpers
│   ├── scripts/            # Database tools
│   └── wrangler.toml       # Worker config
│
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── pages/         # Route components
│   │   ├── components/    # Reusable UI
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API client
│   └── vite.config.js     # Build config
│
├── database/              # Database schema
│   ├── schema.sql        # Table definitions
│   └── migrations/       # Schema changes
│
└── docs/                 # Documentation
    ├── DEPLOYMENT_GUIDE.md
    └── PROJECT_OVERVIEW.md
```

## Key Features

- **Shipment Tracking** - Process recycling data from retail partners
- **Material Categorization** - Track 30+ material types with contamination rates
- **Analytics Dashboard** - Real-time metrics and reporting
- **G2 Integration** - Automated SFTP file processing
- **Multi-Member Support** - Manage multiple retail partners (Kiehl's, Sephora, etc.)

## Technology Stack

- **Backend**: Cloudflare Workers, Hono, D1 Database
- **Frontend**: React, Vite, TailwindCSS, React Query
- **Auth**: JWT-based authentication with username/password
- **Infrastructure**: Cloudflare Pages & Workers

## Deployment

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy

```bash
# Deploy backend to staging
cd backend
npm run deploy:staging

# Build and deploy frontend
cd frontend
npm run build
wrangler pages deploy dist --project-name=pact-dashboard
```

## API Documentation

Base URL: `https://api.pact.example.com`

### Key Endpoints

- `GET /health` - System health check
- `POST /api/auth/login` - User authentication
- `GET /api/shipments` - List shipments with filters
- `GET /api/reports/summary` - Analytics summary
- `POST /api/g2/upload` - Process G2 file upload

See full API documentation in [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Database Management

```bash
cd backend

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed

# Check database
wrangler d1 execute pact-development --local --command "SELECT COUNT(*) FROM pact_shipments"
```

### Code Style

- ESLint for JavaScript linting
- Prettier for code formatting
- Conventional commits for version control

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - PACT Partners for Advanced Circular Technologies

## Support

- Technical Issues: Create a GitHub issue
- Security: security@pact.com
- General: support@pact.com