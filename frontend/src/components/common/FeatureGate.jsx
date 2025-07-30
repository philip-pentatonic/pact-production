import React from 'react';
import { getTenantInfo } from './TenantSwitcher';

// Feature constants matching backend
const FEATURES = {
  RECYCLING: 'recycling',
  RESALE: 'resale',
  MAIL_BACK: 'mailBack',
  IN_STORE: 'inStore',
  KIOSK: 'kiosk',
  GAMIFICATION: 'gamification',
  ANALYTICS_RECYCLING: 'analyticsRecycling',
  ANALYTICS_RESALE: 'analyticsResale',
  ANALYTICS_CONSUMER: 'analyticsConsumer',
  ANALYTICS_COST: 'analyticsCost',
  WAREHOUSE_OPS: 'warehouseOps',
  TRADE_IN_PROCESSING: 'tradeInProcessing',
  INVENTORY_MANAGEMENT: 'inventoryManagement',
  CONSUMER_PORTAL: 'consumerPortal',
  MOBILE_APP: 'mobileApp',
  NOTIFICATIONS: 'notifications',
  API_ACCESS: 'apiAccess',
  CUSTOM_REPORTS: 'customReports',
  BULK_OPERATIONS: 'bulkOperations',
  MULTI_LOCATION: 'multiLocation'
};

// Feature metadata
const FEATURE_METADATA = {
  [FEATURES.RECYCLING]: {
    name: 'Recycling Program',
    description: 'Accept and process recyclable materials from customers',
    icon: '♻️',
    benefits: [
      'Track recycling metrics',
      'Manage collection locations',
      'Generate environmental impact reports'
    ]
  },
  [FEATURES.RESALE]: {
    name: 'Resale & Trade-In Program',
    description: 'Buy back used products and resell them',
    icon: '🛍️',
    benefits: [
      'Automated valuation system',
      'Trade-in processing workflow',
      'Resale marketplace integration'
    ]
  },
  [FEATURES.ANALYTICS_RESALE]: {
    name: 'Resale Analytics',
    description: 'Advanced analytics for your trade-in and resale program',
    icon: '📈',
    benefits: [
      'Trade-in conversion metrics',
      'Customer lifetime value analysis',
      'Performance tracking by category'
    ]
  }
};

// Check if tenant has access to a feature
function hasFeature(tenant, feature) {
  if (!tenant || !tenant.features) return false;
  
  // Direct feature check
  if (tenant.features[feature] === true) return true;
  
  // Legacy mappings for analytics features
  const legacyMappings = {
    [FEATURES.ANALYTICS_RECYCLING]: tenant.features.recycling,
    [FEATURES.ANALYTICS_RESALE]: tenant.features.resale,
    [FEATURES.TRADE_IN_PROCESSING]: tenant.features.resale,
    [FEATURES.WAREHOUSE_OPS]: tenant.features.recycling || tenant.features.resale
  };
  
  return legacyMappings[feature] || false;
}

// Feature access denied component
function FeatureAccessDenied({ feature, showUpgrade = true }) {
  const metadata = FEATURE_METADATA[feature] || {
    name: feature,
    description: 'This feature is not available for your account.',
    icon: '🔒'
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Icon */}
          <div className="text-6xl mb-4">{metadata.icon}</div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {metadata.name} Not Available
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            This feature isn't enabled in your environment. Please speak to Pentatonic if you are interested in enabling it.
          </p>
          
          {/* Benefits (if upgrade shown) */}
          {showUpgrade && metadata.benefits && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                What you're missing:
              </h3>
              <ul className="text-left space-y-2">
                {metadata.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* CTA */}
          <div className="space-y-3">
            {showUpgrade && (
              <>
                <button
                  onClick={() => window.location.href = 'mailto:info@pentatonic.com?subject=Interested in ' + metadata.name}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Contact Pentatonic to Enable
                </button>
                <p className="text-sm text-gray-500">
                  or speak to your Account Manager
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main FeatureGate component
function FeatureGate({ 
  feature, 
  children, 
  fallback = null, 
  showUpgrade = true 
}) {
  const tenant = getTenantInfo();
  const hasAccess = hasFeature(tenant, feature);
  
  if (hasAccess) {
    return children;
  }
  
  // Use custom fallback or default access denied component
  return fallback || <FeatureAccessDenied feature={feature} showUpgrade={showUpgrade} />;
}

// Hook to check feature access
export function useFeatureAccess(feature) {
  const tenant = getTenantInfo();
  return hasFeature(tenant, feature);
}

// Hook to get all available features
export function useAvailableFeatures() {
  const tenant = getTenantInfo();
  const availableFeatures = [];
  
  Object.entries(FEATURES).forEach(([key, feature]) => {
    if (hasFeature(tenant, feature)) {
      availableFeatures.push({
        key,
        feature,
        metadata: FEATURE_METADATA[feature]
      });
    }
  });
  
  return availableFeatures;
}

export { FeatureGate, FEATURES };