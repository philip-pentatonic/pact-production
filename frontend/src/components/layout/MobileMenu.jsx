import React, { useState } from 'react';

function MobileMenu({ activeTab, onTabChange, isAdmin, unreadNotifications }) {
  const [isOpen, setIsOpen] = useState(false);

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'warehouse-operations', label: 'Warehouse Ops', icon: '🏭' },
    { id: 'kiosk-monitoring', label: 'Kiosk Monitoring', icon: '📱' },
    { id: 'admin-stores', label: 'Stores', icon: '🏪' },
    { id: 'data-sources', label: 'Data Sources', icon: '🔌' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'consumer-analytics', label: 'Consumer', icon: '👥' },
    { id: 'cost-tracking', label: 'Costs', icon: '💰' },
    { id: 'instructions', label: 'Instructions', icon: '📖' },
    { id: 'store-rankings', label: 'Rankings', icon: '🏆' },
    { id: 'average-metrics', label: 'Avg Metrics', icon: '🧮' },
    { id: 'pact-mailback-packages', label: 'PACT Packages', icon: '📦' },
    { id: 'pact-g2-uploads', label: 'G2 Uploads', icon: '📤' },
    { id: 'pact-store-batches', label: 'Store Batches', icon: '📋' },
    { id: 'pact-analytics', label: 'PACT Analytics', icon: '📊' }
  ];

  const memberTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' }
  ];

  const tabs = isAdmin ? adminTabs : memberTabs;

  return (
    <>
      {/* Mobile menu button with notification indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg relative"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
        {unreadNotifications > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800">Navigation</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsOpen(false);
                  }}
                  className={`p-4 rounded-lg flex flex-col items-center justify-center transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl mb-2">{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Quick Actions Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onTabChange('notifications');
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">🔔</span>
                    <span className="text-sm font-medium">Notifications</span>
                  </div>
                  {unreadNotifications > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                {isAdmin && (
                  <button
                    onClick={() => {
                      onTabChange('performance');
                      setIsOpen(false);
                    }}
                    className={`w-full p-3 rounded-lg flex items-center transition-colors ${
                      activeTab === 'performance'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl mr-3">⚡</span>
                    <span className="text-sm font-medium">Performance</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    onTabChange('api-keys');
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 rounded-lg flex items-center transition-colors ${
                    activeTab === 'api-keys'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl mr-3">🔑</span>
                  <span className="text-sm font-medium">API Keys</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileMenu; 