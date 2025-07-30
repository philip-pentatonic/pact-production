import React from 'react';
import { getTenantInfo } from './TenantSwitcher';
import { FEATURES } from '../common/FeatureGate';

// Feature groups and metadata
const FEATURE_GROUPS = {
  CORE: {
    name: 'Core Programs',
    features: [
      { key: FEATURES.RECYCLING, name: 'Recycling Program', description: 'Accept and process recyclable materials', icon: '♻️' },
      { key: FEATURES.RESALE, name: 'Resale & Trade-In', description: 'Buy back and resell used products', icon: '🛍️' },
      { key: FEATURES.MAIL_BACK, name: 'Mail-Back Program', description: 'Allow customers to mail in items', icon: '📦' },
      { key: FEATURES.IN_STORE, name: 'In-Store Collection', description: 'Collect items at physical locations', icon: '🏪' }
    ]
  },
  ANALYTICS: {
    name: 'Analytics & Reporting',
    features: [
      { key: FEATURES.ANALYTICS_RECYCLING, name: 'Recycling Analytics', description: 'Track recycling metrics and trends', icon: '📊' },
      { key: FEATURES.ANALYTICS_RESALE, name: 'Resale Analytics', description: 'Trade-in and resale insights', icon: '📈' },
      { key: FEATURES.ANALYTICS_CONSUMER, name: 'Consumer Analytics', description: 'Customer behavior and engagement', icon: '👥' },
      { key: FEATURES.ANALYTICS_COST, name: 'Cost Tracking', description: 'Financial analysis and ROI', icon: '💰' }
    ]
  },
  OPERATIONS: {
    name: 'Operations',
    features: [
      { key: FEATURES.WAREHOUSE_OPS, name: 'Warehouse Operations', description: 'Package processing and tracking', icon: '🏭' },
      { key: FEATURES.TRADE_IN_PROCESSING, name: 'Trade-In Processing', description: 'Evaluate and process trade-ins', icon: '🔍' },
      { key: FEATURES.KIOSK, name: 'Self-Service Kiosks', description: 'Interactive kiosks for drop-offs', icon: '🖥️' }
    ]
  },
  CUSTOMER: {
    name: 'Customer Experience',
    features: [
      { key: FEATURES.CONSUMER_PORTAL, name: 'Consumer Portal', description: 'Customer accounts and history', icon: '👤' },
      { key: FEATURES.GAMIFICATION, name: 'Rewards & Gamification', description: 'Points, badges, and challenges', icon: '🏆' },
      { key: FEATURES.NOTIFICATIONS, name: 'Notifications', description: 'Email and push notifications', icon: '🔔' }
    ]
  }
};

function FeatureSettings() {
  const tenant = getTenantInfo();
  
  const hasFeature = (feature) => {
    if (!tenant || !tenant.features) return false;
    
    // Direct check
    if (tenant.features[feature] === true) return true;
    
    // Legacy mappings
    const legacyMappings = {
      [FEATURES.ANALYTICS_RECYCLING]: tenant.features.recycling,
      [FEATURES.ANALYTICS_RESALE]: tenant.features.resale,
      [FEATURES.TRADE_IN_PROCESSING]: tenant.features.resale,
      [FEATURES.WAREHOUSE_OPS]: tenant.features.recycling || tenant.features.resale
    };
    
    return legacyMappings[feature] || false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feature Settings</h1>
            <p className="text-gray-600 mt-1">
              View enabled features for {tenant?.name || 'your organization'}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Industry: {tenant?.industry || 'Not specified'}
          </div>
        </div>
      </div>

      {/* Feature Groups */}
      {Object.entries(FEATURE_GROUPS).map(([groupKey, group]) => (
        <div key={groupKey} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{group.name}</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.features.map((feature) => {
                const isEnabled = hasFeature(feature.key);
                
                return (
                  <div
                    key={feature.key}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      isEnabled 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {isEnabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </div>
                    
                    {/* Feature Info */}
                    <div className="pr-16">
                      <div className="text-3xl mb-3">{feature.icon}</div>
                      <h3 className={`font-semibold ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {feature.name}
                      </h3>
                      <p className={`text-sm mt-1 ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Action */}
                    {!isEnabled && (
                      <div className="mt-4">
                        <button
                          onClick={() => window.location.href = `mailto:sales@pactcollective.com?subject=Enable ${feature.name} for ${tenant?.name}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Request Access →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Contact Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Need Additional Features?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Contact your Account Manager or our sales team to discuss enabling additional features for your organization.</p>
              <div className="mt-3 space-x-4">
                <a href="mailto:sales@pactcollective.com" className="font-medium text-blue-600 hover:text-blue-800">
                  Email Sales
                </a>
                <a href="tel:1-800-PACT" className="font-medium text-blue-600 hover:text-blue-800">
                  Call Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureSettings;