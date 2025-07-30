# Tenant Theme System Usage Guide

## Overview
The tenant theme system applies PACT's teal color scheme (and other tenant colors) throughout the admin app based on the selected tenant.

## What's Been Implemented

### 1. Theme System (`/src/utils/tenantThemes.js`)
- **PACT Theme**: Uses the teal color palette from the PDF templates
  - Primary: `#2E888D` (Primary Teal)
  - Secondary: `#51ADA5` (Secondary Teal) 
  - Accent: `#73B5B2` (Light Teal)
  - Surface: `#F8FAFA` (Very light teal background)

### 2. Theme Provider (`/src/components/common/ThemeProvider.jsx`)
- Automatically applies CSS variables based on active tenant
- Listens for tenant changes and updates theme dynamically
- Applied at the App level to affect entire application

### 3. CSS Variables (`/src/index.css`)
- CSS custom properties for all theme colors
- Utility classes for quick theming:
  - `.bg-primary`, `.bg-secondary`, `.bg-accent`
  - `.text-primary`, `.text-secondary`, `.text-accent`
  - `.border-primary`, `.border-secondary`, `.border-default`
  - `.gradient-primary`, `.gradient-card`

### 4. Updated Components
- **TenantSwitcher**: Now shows PACT teal dot instead of black
- **Dashboard**: Uses tenant-aware color palette for charts
- **ReportGeneratorV3**: Export button uses tenant primary color

## How to Use in Components

### Method 1: CSS Variables (Recommended)
```jsx
// Use utility classes
<button className="bg-primary text-white hover:bg-primary-hover">
  PACT Button
</button>

// Or inline styles with CSS variables
<div style={{ 
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-primary)'
}}>
  Themed content
</div>
```

### Method 2: JavaScript Theme Object
```jsx
import { getTenantTheme } from '../../utils/tenantThemes';

function MyComponent() {
  const theme = getTenantTheme();
  
  return (
    <div style={{ backgroundColor: theme.colors.primary }}>
      Content with tenant colors
    </div>
  );
}
```

### Method 3: Chart Colors
```jsx
import { getTenantTheme } from '../../utils/tenantThemes';

const theme = getTenantTheme();
const CHART_COLORS = [
  theme.colors.primary,
  theme.colors.secondary,
  theme.colors.accent,
  theme.colors.success
];
```

## Current Status

✅ **Completed:**
- Theme system architecture
- PACT teal color scheme extracted from PDF
- CSS variables and utility classes
- Theme provider integration
- Basic component examples

🔄 **Next Steps (if needed):**
- Apply theme to navigation/sidebar
- Update all button components
- Theme chart colors throughout analytics
- Update form inputs and modals
- Apply surface colors to cards and panels

## Testing
Switch between tenants using the TenantSwitcher to see:
- PACT: Teal color scheme
- Carhartt: Yellow/brown scheme  
- Stanley: Navy/gold scheme

The theme automatically updates and persists across page reloads.