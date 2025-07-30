# PACT Admin Dashboard

Multi-tenant admin dashboard for the PACT recycling and resale platform.

## Features

### Core Functionality
- **Multi-tenant Support**: Switch between tenants (Kiehl's, Carhartt, Stanley)
- **User Authentication**: Clerk-based authentication with role management
- **Feature Gating**: Show/hide features based on tenant configuration
- **Responsive Design**: Mobile-friendly interface

### Admin Modules

#### Operations Management
- **Dashboard**: Overview of key metrics and quick actions
- **Warehouse Operations**: Monitor package processing and trade-ins
- **Kiosk Monitoring**: Track in-store kiosk performance
- **Data Sources**: Manage data imports and uploads

#### Resale Program (Tenant-specific)
- **Trade-In Submissions**: Review and manage trade-in requests
- **Resale Listings**: Manage marketplace listings
- **Orders & Fulfillment**: Process resale orders
- **Valuation Rules**: Configure trade-in pricing

#### Analytics & Reporting
- **Recycling Analytics**: Environmental impact metrics
- **Resale Analytics**: Trade-in and sales performance
- **Consumer Analytics**: Customer behavior insights
- **Store Rankings**: Performance by location
- **Average Metrics**: Aggregated statistics
- **Cost Tracking**: Financial analytics

#### System Management
- **Stores & Inventory**: Location management
- **Notifications**: System alerts and messages
- **API Keys**: Developer access management
- **Instructions**: User guides and documentation
- **Performance**: System monitoring

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Charts**: Recharts
- **State**: React hooks
- **Build Tool**: Vite

## Project Structure

```
frontend-admin/
├── public/
│   ├── images/          # Product images
│   └── favicon.svg      # App icon
├── src/
│   ├── components/      # Organized React components
│   │   ├── analytics/   # Analytics components (5)
│   │   │   ├── Analytics.jsx
│   │   │   ├── AverageMetrics.jsx
│   │   │   ├── ConsumerAnalytics.jsx
│   │   │   ├── ResaleAnalytics.jsx
│   │   │   └── StoreRankings.jsx
│   │   ├── auth/        # Authentication (1)
│   │   │   └── Login.jsx
│   │   ├── common/      # Shared components (5)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FeatureAwareNavigation.jsx
│   │   │   ├── FeatureGate.jsx
│   │   │   ├── MemberDashboard.jsx
│   │   │   └── TenantSwitcher.jsx
│   │   ├── layout/      # Layout components (2)
│   │   │   ├── MobileMenu.jsx
│   │   │   └── Navigation.jsx
│   │   ├── modals/      # Modal components (2)
│   │   │   ├── SessionDetailModal.jsx
│   │   │   └── TradeInDetailModal.jsx
│   │   ├── operations/  # Operations components (5)
│   │   │   ├── DataSources.jsx
│   │   │   ├── DataUpload.jsx
│   │   │   ├── KioskMonitoring.jsx
│   │   │   ├── TodaysSessions.jsx
│   │   │   └── WarehouseOperations.jsx
│   │   ├── resale/      # Resale components (4)
│   │   │   ├── ResaleListings.jsx
│   │   │   ├── ResaleOrders.jsx
│   │   │   ├── TradeIns.jsx
│   │   │   └── ValuationRules.jsx
│   │   └── system/      # System components (7)
│   │       ├── AdminStores.jsx
│   │       ├── ApiKeys.jsx
│   │       ├── CostTracking.jsx
│   │       ├── FeatureSettings.jsx
│   │       ├── Instructions.jsx
│   │       ├── Notifications.jsx
│   │       ├── Performance.jsx
│   │       └── ReportTemplates.jsx
│   ├── utils/           # Utility functions
│   │   └── formatters.js
│   ├── App.jsx          # Main app component
│   ├── index.jsx        # Entry point
│   ├── config.js        # Configuration
│   └── index.css        # Global styles
└── dist/                # Build output
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Update API URL in config.js if needed
```

3. Start development server:
```bash
npm run dev
```

The dashboard will be available at http://localhost:4000

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

Edit `src/config.js` to configure:
- API base URL
- Tenant settings
- Feature flags

## Authentication

The dashboard uses Clerk for authentication with the following roles:
- **admin**: Full access to all features
- **member**: Limited access based on tenant
- **store_manager**: Store-specific access
- **warehouse_staff**: Warehouse operations only
- **pact_staff**: Restricted to Kiehl's tenant

## Multi-Tenant Architecture

### Tenant Switching
- Admins can switch between tenants using the dropdown
- PACT staff are restricted to Kiehl's only
- Feature availability depends on tenant configuration

### Feature Gating
Components use `FeatureGate` to show/hide based on tenant:
```jsx
<FeatureGate feature={FEATURES.RESALE}>
  <TradeIns />
</FeatureGate>
```

## Key Components

### Layout
- **Navigation**: Top navigation with dropdowns
- **MobileMenu**: Mobile-responsive menu
- **TenantSwitcher**: Tenant selection dropdown

### Feature Components
- **Dashboard**: Main overview with metrics
- **WarehouseOperations**: Package processing
- **TradeIns**: Trade-in management
- **Analytics**: Various analytics views

### Utility Components
- **FeatureGate**: Conditional rendering
- **SessionDetailModal**: Detailed session view
- **TradeInDetailModal**: Trade-in details

## API Integration

All API calls use the configuration from `config.js`:
```javascript
const API_URL = getApiUrl('/endpoint');
```

Authentication headers are automatically added.

## Deployment

### Build
```bash
npm run build
```

### Deploy to Cloudflare Pages
```bash
wrangler pages deploy dist --project-name pact-admin
```

## Production URLs

- Main: https://pact-admin.pages.dev
- Staging: https://staging.pact-admin.pages.dev

## License

Private - PACT Collective