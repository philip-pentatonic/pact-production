import React, { useEffect } from 'react';
import { getTenantTheme, generateCSSVariables } from '../../utils/tenantThemes';

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const applyTheme = () => {
      const theme = getTenantTheme();
      const cssVariables = generateCSSVariables(theme);
      
      // Apply CSS variables to the root element
      const root = document.documentElement;
      Object.entries(cssVariables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
      
      // Also apply to body for immediate background changes
      document.body.style.backgroundColor = theme.colors.background;
    };

    // Apply theme on mount
    applyTheme();

    // Listen for tenant changes (from TenantSwitcher)
    const handleTenantChange = () => {
      // Small delay to ensure localStorage is updated
      setTimeout(applyTheme, 100);
    };

    // Listen for storage changes (when tenant is switched)
    window.addEventListener('storage', handleTenantChange);
    
    // Also listen for our custom event when tenant changes in same tab
    window.addEventListener('tenantChanged', handleTenantChange);

    return () => {
      window.removeEventListener('storage', handleTenantChange);
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, []);

  return <>{children}</>;
}