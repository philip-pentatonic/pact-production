import React, { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
// Common components
import Dashboard from './common/Dashboard';
import MemberDashboard from './common/MemberDashboard';
import TenantSwitcher from './common/TenantSwitcher';
import MemberSwitcher from './common/MemberSwitcher';
import { FeatureGate, FEATURES } from './common/FeatureGate';
// Auth components
import Login from './auth/Login';
// Layout components
import Navigation from './layout/Navigation';
import MobileMenu from './layout/MobileMenu';
// Analytics components
import Analytics from './analytics/Analytics';
import ConsumerAnalytics from './analytics/ConsumerAnalytics';
import ResaleAnalytics from './analytics/ResaleAnalytics';
import StoreRankings from './analytics/StoreRankings';
import AverageMetrics from './analytics/AverageMetrics';
import ReportGenerator from './analytics/ReportGeneratorV3';
// Operations components
import DataSources from './operations/DataSources';
import WarehouseOperations from './operations/WarehouseOperations';
import KioskMonitoring from './operations/KioskMonitoring';
// Resale components
import TradeIns from './resale/TradeIns';
import ResaleListings from './resale/ResaleListings';
import ResaleOrders from './resale/ResaleOrders';
import ValuationRules from './resale/ValuationRules';
// System components
import AdminStores from './system/AdminStores';
import ApiKeys from './system/ApiKeys';
import CostTracking from './system/CostTracking';
import Instructions from './system/Instructions';
import Notifications from './system/Notifications';
import Performance from './system/Performance';
// PACT components
import MailbackPackages from './pact/MailbackPackages';
import G2Uploads from './pact/G2Uploads';
import StoreBatches from './pact/StoreBatches';
import PACTAnalytics from './pact/PACTAnalytics';
import { getApiUrl } from '../config';
import DemoBanner from './DemoBanner';

function AppContent() {
  const { isPactAdmin, isBrandMember, getCurrentMember } = useTenant();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userRestrictions, setUserRestrictions] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // If user is associated with a member, set their tenant
      if (parsedUser.member_code) {
        localStorage.setItem('activeTenant', parsedUser.member_code.toLowerCase());
      }
      
      // Fetch user restrictions
      fetchUserRestrictions(token);
    }
    setLoading(false);
  }, []);

  const fetchUserRestrictions = async (token) => {
    try {
      const response = await fetch(`${getApiUrl('/auth/me')}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserRestrictions(data.user);
        
        // If user has tenant restriction, set their allowed tenant
        if (data.user.allowed_tenant_id) {
          // Map tenant IDs to codes
          const tenantMap = {
            1: 'pact',
            2: 'kiehls', 
            3: 'carhartt',
            4: 'stanley'
          };
          const tenantCode = tenantMap[data.user.allowed_tenant_id];
          if (tenantCode) {
            localStorage.setItem('activeTenant', tenantCode);
          }
        }
        // If PACT staff, force Kiehl's tenant (legacy support)
        else if (data.user.isPactStaff) {
          localStorage.setItem('activeTenant', 'kiehls');
        }
      } else if (response.status === 401) {
        // Token is invalid or expired, force logout
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user restrictions:', error);
    }
  };

  // Fetch unread notifications count
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Set up tenant header for all API requests and handle 401 errors
  useEffect(() => {
    const currentTenant = localStorage.getItem('activeTenant') || 'kiehls';
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      let [url, options = {}] = args;
      // Only add X-Tenant-Code if it's not already set and it's an API call
      if (url.includes('pact-mvp-backend') && (!options.headers || !options.headers['X-Tenant-Code'])) {
        options.headers = {
          ...options.headers,
          'X-Tenant-Code': currentTenant
        };
      }
      
      const response = await originalFetch(url, options);
      
      // If we get a 401, the token is invalid - force logout
      if (response.status === 401 && url.includes('/api/')) {
        handleLogout();
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch(`${getApiUrl('/notifications')}?unread=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogin = (token, userData) => {
    console.log('handleLogin called with:', { token: token?.substring(0, 20) + '...', userData });
    setIsAuthenticated(true);
    setUser(userData);
    // Fetch user restrictions after login
    fetchUserRestrictions(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Determine which dashboard to show based on user role
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member' || user?.role === 'store_manager';
  const currentMember = getCurrentMember();

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner />
      {/* Header with user info and logout */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {isBrandMember() ? `${currentMember?.name || 'Member'} Portal` : 'PACT Admin Dashboard'}
              </h1>
              {isBrandMember() && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {currentMember?.code}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Tenant Switcher for Admin (only show for super admins) */}
              {isAdmin && userRestrictions?.is_super_admin && (
                <TenantSwitcher />
              )}
              
              {/* Member Switcher for PACT tenant */}
              <MemberSwitcher />
              
              {/* Notifications Icon */}
              <button
                onClick={() => setActiveTab('notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-500"
                title="Notifications"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                  className="flex items-center text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium px-2 py-1 sm:px-3 sm:py-2 rounded-md hover:bg-gray-100"
                >
                  <span className="hidden sm:inline mr-1">
                    {user?.name || user?.email}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b">
                        {user?.email}
                        <div className="text-gray-400">{user?.role?.replace('_', ' ')}</div>
                      </div>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => { setActiveTab('performance'); setShowUserMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Performance
                          </button>
                        </>
                      )}
                      {(isAdmin || isMember) && (
                        <button
                          onClick={() => { setActiveTab('api-keys'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          API Keys
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        {isAdmin && (
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
        )}
        {isMember && !isAdmin && (
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
        {isAdmin ? (
          activeTab === 'dashboard' ? <Dashboard onTabChange={setActiveTab} /> : 
          activeTab === 'kiosk-monitoring' ? <KioskMonitoring /> :
          activeTab === 'data-sources' ? <DataSources /> :
          activeTab === 'analytics' ? <Analytics /> :
          activeTab === 'consumer-analytics' ? <ConsumerAnalytics /> :
          activeTab === 'cost-tracking' ? <CostTracking /> :
          activeTab === 'instructions' ? <Instructions /> :
          activeTab === 'notifications' ? <Notifications /> :
          activeTab === 'store-rankings' ? <StoreRankings /> :
          activeTab === 'average-metrics' ? <AverageMetrics /> :
          activeTab === 'performance' ? <Performance /> :
          activeTab === 'warehouse-operations' ? <WarehouseOperations /> :
          activeTab === 'admin-stores' ? <AdminStores /> :
          activeTab === 'api-keys' ? <ApiKeys /> :
          activeTab === 'trade-ins' ? <FeatureGate feature={FEATURES.RESALE}><TradeIns /></FeatureGate> :
          activeTab === 'resale-listings' ? <FeatureGate feature={FEATURES.RESALE}><ResaleListings /></FeatureGate> :
          activeTab === 'resale-orders' ? <FeatureGate feature={FEATURES.RESALE}><ResaleOrders /></FeatureGate> :
          activeTab === 'valuation-rules' ? <FeatureGate feature={FEATURES.RESALE}><ValuationRules /></FeatureGate> :
          activeTab === 'resale-analytics' ? <FeatureGate feature={FEATURES.ANALYTICS_RESALE}><ResaleAnalytics /></FeatureGate> :
          activeTab === 'report-generator' ? <ReportGenerator /> :
          activeTab === 'pact-mailback-packages' ? <MailbackPackages /> :
          activeTab === 'pact-g2-uploads' ? <G2Uploads /> :
          activeTab === 'pact-store-batches' ? <StoreBatches /> :
          activeTab === 'pact-analytics' ? <PACTAnalytics /> : <Dashboard onTabChange={setActiveTab} />
        ) : isMember ? (
          activeTab === 'dashboard' ? <MemberDashboard user={user} /> :
          activeTab === 'api-keys' ? <ApiKeys /> : <MemberDashboard user={user} />
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-600">No dashboard available for your role.</p>
          </div>
        )}
      </main>

      {/* Mobile Menu */}
      <MobileMenu 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
        unreadNotifications={unreadNotifications}
      />
    </div>
  );
}

export default AppContent;