import React, { useState, useEffect, useRef } from 'react';
import { useFeatureAccess, FEATURES } from './FeatureGate';

const FeatureAwareNavigation = ({ activeTab, onTabChange, isAdmin }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Check feature access
  const hasRecycling = useFeatureAccess(FEATURES.RECYCLING);
  const hasResale = useFeatureAccess(FEATURES.RESALE);
  const hasWarehouseOps = useFeatureAccess(FEATURES.WAREHOUSE_OPS);
  const hasKiosk = useFeatureAccess(FEATURES.KIOSK);
  const hasAnalyticsRecycling = useFeatureAccess(FEATURES.ANALYTICS_RECYCLING);
  const hasAnalyticsResale = useFeatureAccess(FEATURES.ANALYTICS_RESALE);
  const hasConsumerAnalytics = useFeatureAccess(FEATURES.ANALYTICS_CONSUMER);
  const hasCostTracking = useFeatureAccess(FEATURES.ANALYTICS_COST);

  const toggleDropdown = (name, event) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleTabClick = (tab) => {
    onTabChange(tab);
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build navigation items based on features
  const navItems = [
    {
      name: 'Dashboard',
      tab: 'dashboard',
      single: true,
      visible: true
    },
    {
      name: 'Operations',
      dropdown: true,
      visible: hasWarehouseOps || hasKiosk || isAdmin,
      items: [
        { name: 'Warehouse Operations', tab: 'warehouse-operations', visible: hasWarehouseOps },
        { name: 'Kiosk Monitoring', tab: 'kiosk-monitoring', visible: hasKiosk },
        { name: 'Data Sources', tab: 'data-sources', visible: isAdmin }
      ].filter(item => item.visible)
    },
    {
      name: 'Resale Program',
      dropdown: true,
      visible: hasResale,
      items: [
        { name: 'Trade-In Submissions', tab: 'trade-ins' },
        { name: 'Resale Listings', tab: 'resale-listings' },
        { name: 'Orders & Fulfillment', tab: 'resale-orders' },
        { name: 'Valuation Rules', tab: 'valuation-rules' }
      ]
    },
    {
      name: 'Analytics',
      dropdown: true,
      visible: hasAnalyticsRecycling || hasAnalyticsResale || hasConsumerAnalytics || hasCostTracking,
      items: [
        { name: 'Recycling Analytics', tab: 'analytics', visible: hasAnalyticsRecycling },
        { name: 'Resale Analytics', tab: 'resale-analytics', visible: hasAnalyticsResale },
        { name: 'Consumer Analytics', tab: 'consumer-analytics', visible: hasConsumerAnalytics },
        { name: 'Store Rankings', tab: 'store-rankings', visible: hasAnalyticsRecycling },
        { name: 'Average Metrics', tab: 'average-metrics', visible: hasAnalyticsRecycling },
        { name: 'Cost Tracking', tab: 'cost-tracking', visible: hasCostTracking }
      ].filter(item => item.visible !== false)
    },
    {
      name: 'Management',
      dropdown: true,
      visible: isAdmin,
      items: [
        { name: 'Stores & Inventory', tab: 'admin-stores' },
        { name: 'Notifications', tab: 'notifications' },
        { name: 'API Keys', tab: 'api-keys' },
        { name: 'Instructions', tab: 'instructions' }
      ]
    }
  ].filter(item => item.visible !== false);

  return (
    <div className="bg-white shadow-sm border-b relative" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <div key={item.name} className="relative">
              {item.single ? (
                <button
                  onClick={() => handleTabClick(item.tab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === item.tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => toggleDropdown(item.name, e)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                      item.items.some(subItem => activeTab === subItem.tab)
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {item.name}
                    <svg
                      className={`ml-2 h-4 w-4 transition-transform ${
                        openDropdown === item.name ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === item.name && (
                    <div className="absolute left-0 top-full mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50" style={{ minWidth: '14rem' }}>
                      <div className="py-1">
                        {item.items.map((subItem) => (
                          <button
                            key={subItem.tab}
                            onClick={() => handleTabClick(subItem.tab)}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              activeTab === subItem.tab
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {subItem.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureAwareNavigation;