import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const TENANTS = [
  {
    code: 'pact',
    name: "PACT Collective",
    logo: '/assets/logo.svg',
    color: '#2E888D',
    type: 'recycling',
    features: {
      recycling: true,
      mailBack: true,
      inStore: true,
      kiosk: true,
      resale: false,
      gamification: true,
      analyticsRecycling: true,
      analyticsConsumer: true,
      analyticsCost: true,
      warehouseOps: true,
      memberSwitcher: true // Special feature to show member switcher
    }
  },
  {
    code: 'carhartt',
    name: 'Carhartt',
    logo: '/assets/carhartt-logo.svg',
    color: '#F2A900',
    type: 'resale',
    features: {
      recycling: false,
      mailBack: true,
      inStore: true,
      kiosk: false,
      resale: true,
      gamification: true,
      analyticsResale: true,
      analyticsConsumer: true,
      analyticsCost: true,
      warehouseOps: true,
      tradeInProcessing: true
    }
  },
  {
    code: 'stanley',
    name: 'Stanley1913',
    logo: '/assets/stanley-logo.svg',
    color: '#003057',
    type: 'resale',
    features: {
      recycling: false,
      mailBack: true,
      inStore: true,
      kiosk: false,
      resale: true,
      gamification: true,
      analyticsResale: true,
      analyticsConsumer: true,
      analyticsCost: true,
      warehouseOps: true,
      tradeInProcessing: true
    }
  },
  {
    code: 'TATAHARPER',
    name: 'Tata Harper',
    logo: '/assets/tataharper-logo.svg',
    color: '#008a25',
    type: 'sustainability',
    features: {
      recycling: true,
      mailBack: true,
      inStore: true,
      kiosk: true,
      resale: false,
      refill: true,
      gamification: true,
      analyticsRecycling: true,
      analyticsConsumer: true,
      analyticsCost: true,
      warehouseOps: true,
      sustainabilityMetrics: true
    }
  }
];

export default function TenantSwitcher() {
  const [currentTenant, setCurrentTenant] = useState(() => {
    const stored = localStorage.getItem('activeTenant');
    // Check if stored tenant is valid, otherwise default to pact
    const isValid = TENANTS.some(t => t.code === stored);
    return isValid ? stored : 'pact';
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleTenantChange = (tenantCode) => {
    setCurrentTenant(tenantCode);
    localStorage.setItem('activeTenant', tenantCode);
    localStorage.setItem('demo-tenant', tenantCode); // Keep for backwards compatibility
    setIsOpen(false);
    
    // Dispatch custom event for theme changes
    window.dispatchEvent(new CustomEvent('tenantChanged', { detail: tenantCode }));
    
    // Reload the page to apply new tenant context
    window.location.reload();
  };

  useEffect(() => {
    // Add tenant header to all API requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      let [url, options = {}] = args;
      // Only add X-Tenant-Code if it's not already set
      if (!options.headers || !options.headers['X-Tenant-Code']) {
        options.headers = {
          ...options.headers,
          'X-Tenant-Code': currentTenant
        };
      }
      return originalFetch(url, options);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [currentTenant]);

  const selectedTenant = TENANTS.find(t => t.code === currentTenant) || TENANTS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-default rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: selectedTenant?.color || '#000000' }}
        />
        <span className="font-medium">{selectedTenant?.name || 'Select Tenant'}</span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-50">
          {TENANTS.map(tenant => (
            <button
              key={tenant.code}
              onClick={() => handleTenantChange(tenant.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                tenant.code === currentTenant ? 'bg-gray-100' : ''
              }`}
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tenant.color }}
              />
              <span className="font-medium">{tenant.name}</span>
              {tenant.code === currentTenant && (
                <span className="ml-auto text-sm text-gray-500">Active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Export tenant info for use in other components
export const getTenantInfo = () => {
  const tenantCode = localStorage.getItem('activeTenant') || 'pact';
  return TENANTS.find(t => t.code === tenantCode) || TENANTS[0];
};