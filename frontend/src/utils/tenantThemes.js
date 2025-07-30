// Tenant-specific color themes
export const TENANT_THEMES = {
  pact: {
    name: 'PACT Collective',
    colors: {
      primary: '#2E888D',      // Primary Teal (from PDF)
      primaryHover: '#267278',  // Darker teal for hover states
      secondary: '#51ADA5',     // Secondary Teal (from PDF)
      accent: '#73B5B2',       // Light Teal (from material colors)
      background: '#FFFFFF',    // White
      surface: '#F8FAFA',      // Very light teal background
      text: {
        primary: '#1C1C1C',    // Black (from PDF)
        secondary: '#4A5568',   // Dark gray
        muted: '#718096'       // Medium gray
      },
      border: '#DCE4E2',       // Light Gray (from PDF)
      success: '#48BB78',      // Green
      warning: '#ED8936',      // Orange  
      error: '#F56565',        // Red
      info: '#4299E1'          // Blue
    },
    gradients: {
      primary: 'linear-gradient(135deg, #2E888D 0%, #51ADA5 100%)',
      card: 'linear-gradient(135deg, #F8FAFA 0%, #FFFFFF 100%)'
    }
  },
  carhartt: {
    name: 'Carhartt',
    colors: {
      primary: '#F2A900',      // Carhartt Yellow
      primaryHover: '#D4940A',
      secondary: '#8B4513',     // Brown
      accent: '#FFC947',       // Light Yellow
      background: '#FFFFFF',
      surface: '#FFFDF7',      // Very light yellow background
      text: {
        primary: '#1A202C',
        secondary: '#4A5568',
        muted: '#718096'
      },
      border: '#E2E8F0',
      success: '#48BB78',
      warning: '#ED8936',
      error: '#F56565',
      info: '#4299E1'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #F2A900 0%, #FFC947 100%)',
      card: 'linear-gradient(135deg, #FFFDF7 0%, #FFFFFF 100%)'
    }
  },
  stanley: {
    name: 'Stanley1913',
    colors: {
      primary: '#003057',      // Stanley Navy
      primaryHover: '#002142',
      secondary: '#FFD700',     // Gold
      accent: '#4A90E2',       // Light Blue
      background: '#FFFFFF',
      surface: '#F7F9FC',      // Very light blue background
      text: {
        primary: '#1A202C',
        secondary: '#4A5568',
        muted: '#718096'
      },
      border: '#E2E8F0',
      success: '#48BB78',
      warning: '#ED8936',
      error: '#F56565',
      info: '#4299E1'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #003057 0%, #4A90E2 100%)',
      card: 'linear-gradient(135deg, #F7F9FC 0%, #FFFFFF 100%)'
    }
  }
};

// Hook to get current tenant theme
export const useTenantTheme = () => {
  const tenantCode = localStorage.getItem('activeTenant') || 'pact';
  return TENANT_THEMES[tenantCode] || TENANT_THEMES.pact;
};

// Get tenant theme by code
export const getTenantTheme = (tenantCode = null) => {
  const code = tenantCode || localStorage.getItem('activeTenant') || 'pact';
  return TENANT_THEMES[code] || TENANT_THEMES.pact;
};

// CSS Custom Properties Generator
export const generateCSSVariables = (theme) => {
  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-hover': theme.colors.primaryHover,
    '--color-secondary': theme.colors.secondary,
    '--color-accent': theme.colors.accent,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-text-muted': theme.colors.text.muted,
    '--color-border': theme.colors.border,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
    '--color-info': theme.colors.info,
    '--gradient-primary': theme.gradients.primary,
    '--gradient-card': theme.gradients.card
  };
};