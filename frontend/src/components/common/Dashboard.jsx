import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  formatWeight, 
  formatLargeNumber, 
  formatPercentage, 
  formatChartValue,
  formatNumberWithCommas
} from '../../utils/formatters';
import { getApiUrl } from '../../config';
import { useTenant } from '../../contexts/TenantContext';
import { getTenantTheme } from '../../utils/tenantThemes';

// Get tenant-aware colors
const getTenantColors = () => {
  const theme = getTenantTheme();
  return [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.accent,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.error,
    theme.colors.info,
    '#8B5CF6'
  ];
};

const COLORS = getTenantColors();

// Get tenant-aware gradients for metric cards
const getTenantGradients = () => {
  const theme = getTenantTheme();
  return {
    primary: `from-[${theme.colors.primary}] to-[${theme.colors.primaryHover}]`,
    secondary: `from-[${theme.colors.secondary}] to-[${theme.colors.accent}]`,
    accent: `from-[${theme.colors.accent}] to-[${theme.colors.secondary}]`,
    surface: `from-[${theme.colors.accent}] to-[${theme.colors.primary}]`
  };
};

function Dashboard({ onTabChange }) {
  const { getApiFilters, selectedMemberId } = useTenant();
  const [dashboardData, setDashboardData] = useState(null);
  const [kioskData, setKioskData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [contaminationData, setContaminationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState('all'); // Default to 'all' to show uploaded data
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [selectedProgramType, setSelectedProgramType] = useState('all');
  
  // Custom date range state
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Drill-down states
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownType, setDrillDownType] = useState('weight'); // 'weight' or 'items'
  const [drillDownPeriod, setDrillDownPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly'

  useEffect(() => {
    fetchAllData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dateRange, selectedMemberId, useCustomDates, startDate, endDate, selectedProgramType]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantCode = localStorage.getItem('activeTenant') || 'pact';
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'X-Tenant-Code': tenantCode
      };
      
      // Debug log to check if token exists
      console.log('Auth token exists:', !!token);
      console.log('Headers being sent:', headers);

      // Get member filter from context
      const apiFilters = getApiFilters();
      
      // Fetch main dashboard data
      const dashboardParams = new URLSearchParams();
      let warehouseDays = 7; // default for warehouse analytics
      
      // Add member filter if applicable
      if (apiFilters.member_id) {
        dashboardParams.append('member_id', apiFilters.member_id);
      }
      
      // Add program type filter
      // Temporarily disabled to debug 500 error
      // if (selectedProgramType !== 'all') {
      //   dashboardParams.append('program_type', selectedProgramType);
      // }
      
      if (useCustomDates && startDate && endDate) {
        dashboardParams.append('start_date', startDate);
        dashboardParams.append('end_date', endDate);
        warehouseDays = 9999; // All time when using custom dates
      } else if (dateRange !== 'all') {
        if (dateRange.match(/^\d{4}$/)) {
          // Year filter - set start and end dates for the year
          const year = parseInt(dateRange);
          dashboardParams.append('start_date', `${year}-01-01`);
          dashboardParams.append('end_date', `${year}-12-31`);
          warehouseDays = -year; // Negative value for year filter
        } else {
          // Days filter
          const days = parseInt(dateRange.replace('d', ''));
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          dashboardParams.append('start_date', startDate.toISOString().split('T')[0]);
          // Also add end date to ensure we're getting the correct range
          dashboardParams.append('end_date', new Date().toISOString().split('T')[0]);
          warehouseDays = days;
        }
      } else {
        warehouseDays = 9999; // All time
      }
      
      // Build warehouse analytics URL with member filter
      const warehouseParams = new URLSearchParams();
      warehouseParams.append('days', warehouseDays);
      if (apiFilters.member_id) {
        warehouseParams.append('member_id', apiFilters.member_id);
      }
      
      // Build trends URL with member filter
      const trendsParams = new URLSearchParams();
      trendsParams.append('period', '30');
      if (apiFilters.member_id) {
        trendsParams.append('member_id', apiFilters.member_id);
      }
      
      const [dashboardRes, kioskRes, warehouseRes, trendsRes, contaminationRes] = await Promise.all([
        fetch(`${getApiUrl('/data')}?${dashboardParams}`),
        fetch(getApiUrl('/kiosk/activity?limit=20')),
        fetch(getApiUrl(`/admin/warehouse/analytics?${warehouseParams}`), { headers }),
        fetch(getApiUrl(`/analytics/trends?${trendsParams}`), { headers }).catch(err => {
          console.warn('Analytics trends API failed:', err);
          return { ok: false };
        }),
        // Use public endpoint for contamination data with date filters
        fetch(getApiUrl(`/public/contamination?${dashboardParams}`)).catch(err => {
          console.warn('Analytics contamination API failed:', err);
          return { ok: false };
        })
      ]);

      const [dashboard, kiosk, warehouse, trends, contamination] = await Promise.all([
        dashboardRes.ok ? dashboardRes.json() : null,
        kioskRes.ok ? kioskRes.json() : null,
        warehouseRes.ok ? warehouseRes.json() : null,
        trendsRes.ok ? trendsRes.json().catch(() => null) : null,
        contaminationRes.ok ? contaminationRes.json().catch(() => null) : null
      ]);

      // The /api/data endpoint returns data wrapped in success/data structure
      setDashboardData(dashboard?.data || dashboard || {});
      setKioskData(kiosk?.data || kiosk || {});
      setWarehouseData(warehouse?.sessionStats || warehouse?.analytics || {});
      setTrendsData(trends?.data || {});
      setContaminationData(contamination?.data || {});
      
      // Debug log trends data
      console.log('Trends API Response:', trends);
      
      // Debug logging to verify all data structures
      console.log('Dashboard API Response:', {
        totalWeight: dashboard?.data?.totalLbsCollected || dashboard?.totalLbsCollected,
        totalItems: dashboard?.data?.totalItems || dashboard?.totalItems,
        warehouseSessions: dashboard?.data?.warehouseSessions || dashboard?.warehouseSessions,
        materialBreakdown: dashboard?.data?.materialBreakdown || dashboard?.materialBreakdown,
        endOfLifeOutcomes: dashboard?.data?.endOfLifeOutcomes || dashboard?.endOfLifeOutcomes,
        contamination: contamination?.data
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Use centralized formatter
  const formatNumberWithCommas = formatLargeNumber;

  const calculateTrend = (data, key) => {
    if (!data || data.length < 2) return { value: 0, direction: 'stable' };
    const recent = data.slice(0, 7);
    const older = data.slice(7, 14);
    const recentAvg = recent.reduce((sum, item) => sum + (item[key] || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + (item[key] || 0), 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
    };
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  // Prepare chart data with proper formatting - ONLY use real database data
  const materialChartData = dashboardData?.materialBreakdown?.map(item => ({
    name: item.material_type || 'Unknown',
    value: Math.round(parseFloat(item.weight || 0) * 100) / 100, // Changed from item.total_weight to item.weight
    count: item.count || 0 // Changed from item.item_count to item.count
  })).filter(item => item.value > 0) || []; // Only show materials with actual weight

  // Handle trends data - check for different possible structures
  let trendsChartData = [];
  if (trendsData?.trends && Array.isArray(trendsData.trends) && trendsData.trends.length > 0) {
    // API returns trends array with period, item_count, total_weight
    trendsChartData = trendsData.trends.slice(0, 14).reverse().map(item => ({
      date: item.period ? new Date(item.period + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 'Unknown',
      weight: Math.round(parseFloat(item.total_weight || 0) * 100) / 100,
      items: item.item_count || 0
    }));
  } else if (trendsData?.daily) {
    // Legacy structure with daily data
    trendsChartData = trendsData.daily.slice(0, 14).reverse().map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: Math.round(parseFloat(item.total_weight || 0) * 100) / 100,
      items: item.item_count || 0
    }));
  } else if (dashboardData?.yearlyData && dashboardData.yearlyData.length > 0) {
    // Use yearly data from main dashboard API if trends API fails
    // Reverse to show years in ascending order (oldest to newest)
    trendsChartData = dashboardData.yearlyData.slice().reverse().map(item => ({
      date: item.year,
      weight: Math.round(parseFloat(item.total_lbs || 0) * 100) / 100,
      items: item.item_count || 0
    }));
  } else if (dashboardData?.quarterlyData && dashboardData.quarterlyData.length > 0) {
    // Use quarterly data as fallback
    // Reverse to show in chronological order
    trendsChartData = dashboardData.quarterlyData.slice(0, 8).reverse().map(item => ({
      date: `${item.quarter} ${item.year}`,
      weight: Math.round(parseFloat(item.total_lbs || 0) * 100) / 100,
      items: item.item_count || 0
    }));
  } else if (dashboardData?.totalLbsCollected > 0) {
    // If we have data but no trends, show a single data point for today
    trendsChartData = [{
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: dashboardData.totalLbsCollected,
      items: dashboardData.totalItems
    }];
  }

  // Create enhanced trends data that includes top materials info (defined after trendsChartData)
  const enhancedTrendsData = trendsChartData.map(item => ({
    ...item,
    // Add information about top materials for context
    topMaterial: materialChartData[0]?.name || 'N/A',
    topMaterialWeight: materialChartData[0]?.value || 0
  }));

  // Process end-of-life outcomes - ONLY use real database data and remove duplicates
  const rawOutcomeData = dashboardData?.endOfLifeOutcomes || [];
  const outcomeMap = new Map();
  
  // Deduplicate outcomes by name and sum weights
  rawOutcomeData.forEach(item => {
    if (item.end_of_life_outcome && item.total_weight > 0) {
      const name = item.end_of_life_outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const existing = outcomeMap.get(name);
      if (existing) {
        existing.value += Math.round(parseFloat(item.total_weight || 0) * 100) / 100;
        existing.count += item.item_count || 0;
      } else {
        outcomeMap.set(name, {
          name,
          value: Math.round(parseFloat(item.total_weight || 0) * 100) / 100,
          count: item.item_count || 0
        });
      }
    }
  });
  
  const outcomeChartData = Array.from(outcomeMap.values()).sort((a, b) => b.value - a.value);

  // Contamination data - ONLY use real database materials with valid data
  const contaminationChartData = contaminationData?.byMaterial?.filter(item => 
    item.material_type && 
    item.avg_contamination_rate !== null && 
    item.avg_contamination_rate !== undefined &&
    item.sample_count > 0
  ).map(item => ({
    material: item.material_type,
    rate: parseFloat((item.avg_contamination_rate * 100).toFixed(1)), // Limit to 1 decimal place
    samples: item.sample_count
  })) || [];

  // Calculate KPIs - Handle both recycling and resale data
  const isResaleTenant = dashboardData?.totalTradeIns !== undefined;
  
  // Recycling KPIs
  const totalWeight = dashboardData?.totalLbsCollected || 0;
  const totalItems = dashboardData?.totalItems || 0;
  const avgContamination = contaminationData?.byMaterial?.length > 0 
    ? parseFloat((contaminationData.byMaterial.reduce((sum, item) => sum + item.avg_contamination_rate, 0) / contaminationData.byMaterial.length * 100).toFixed(1))
    : 0;
  const kioskTransactions = kioskData?.stats?.total_transactions || 0;
  const warehouseSessions = dashboardData?.warehouseSessions || warehouseData?.total_sessions || 0;
  
  // Resale KPIs
  const totalTradeIns = dashboardData?.totalTradeIns || 0;
  const totalEstimatedValue = dashboardData?.totalEstimatedValue || 0;
  const totalPayoutAmount = dashboardData?.totalPayoutAmount || 0;
  const activeListings = dashboardData?.activeListings || 0;
  const totalResaleRevenue = dashboardData?.totalResaleRevenue || 0;

  const weightTrend = calculateTrend(trendsChartData, 'weight');
  const itemsTrend = calculateTrend(trendsChartData, 'items');
  const valueTrend = calculateTrend(trendsChartData, 'value');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Real-time Indicator */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Command Center</h1>
          <p className="text-gray-600 mt-1">Real-time insights across all operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
          <div className="text-sm text-gray-600">
            Showing: {useCustomDates && startDate && endDate ? 
                     `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` :
                     dateRange === 'all' ? 'All Time' : 
                     dateRange === '1d' ? 'Last 24 Hours' : 
                     dateRange === '7d' ? 'Last 7 Days' : 
                     dateRange === '30d' ? 'Last 30 Days' : 
                     dateRange === '90d' ? 'Last 90 Days' :
                     dateRange.match(/^\d{4}$/) ? dateRange : 'All Time'}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={useCustomDates ? 'custom' : dateRange}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'custom') {
                  setUseCustomDates(true);
                  // Set default dates if not already set
                  if (!startDate) {
                    const today = new Date();
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }
                } else {
                  setUseCustomDates(false);
                  setDateRange(value);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="all">All Time</option>
              <option value="1d">Last 24 Hours</option>
              <option value="custom">Custom range...</option>
            </select>
            
            {/* Custom date pickers */}
            {useCustomDates && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Start date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="End date"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Program Type Filter - Only for recycling tenants */}
      {!isResaleTenant && (
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-700">Program Type:</label>
          <select
            value={selectedProgramType}
            onChange={(e) => setSelectedProgramType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="all">All Programs</option>
            <option value="STORE_DROPOFF">In-Store Drop-off</option>
            <option value="MAIL_BACK">Mail-Back</option>
            <option value="IN_OFFICE">In Office</option>
            <option value="OBSOLETE_INVENTORY">Obsolete Inventory</option>
          </select>
          {selectedProgramType !== 'all' && (
            <span className="text-sm text-gray-600">
              Showing only {selectedProgramType.replace(/_/g, ' ').toLowerCase()} data
            </span>
          )}
        </div>
      )}

      {/* Executive KPI Cards - Conditional based on tenant type */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {isResaleTenant ? (
          <>
            {/* Resale KPI Cards */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Trade-Ins</p>
                  <p className="text-3xl font-bold">{formatNumberWithCommas(totalTradeIns)}</p>
                  <p className="text-blue-100 text-xs">submissions</p>
                </div>
                <div className="text-3xl">🛍️</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Estimated Value</p>
                  <p className="text-3xl font-bold">${formatNumberWithCommas(totalEstimatedValue)}</p>
                  <p className="text-green-100 text-xs">total value</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#73B5B2] to-[#9AC5C4] rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Listings</p>
                  <p className="text-3xl font-bold">{formatNumberWithCommas(activeListings)}</p>
                  <p className="text-white/80 text-xs">for sale</p>
                </div>
                <div className="text-3xl">🏷️</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#51ADA5] to-[#2E888D] rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Resale Revenue</p>
                  <p className="text-3xl font-bold">${formatNumberWithCommas(totalResaleRevenue)}</p>
                  <p className="text-white/80 text-xs">from sales</p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#2E888D] to-[#267278] rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Items</p>
                  <p className="text-3xl font-bold">{formatNumberWithCommas(totalItems)}</p>
                  <p className="text-white/80 text-xs">processed</p>
                </div>
                <div className="text-3xl">📦</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Recycling KPI Cards */}
            <div 
              className="bg-gradient-to-r from-[#2E888D] to-[#267278] rounded-lg p-6 text-white cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => {
                setDrillDownType('weight');
                setShowDrillDown(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Weight</p>
                  <p className="text-3xl font-bold">{formatNumberWithCommas(totalWeight)} lbs</p>
                  <p className="text-white/80 text-xs">collected</p>
                </div>
                <div className={`text-2xl ${weightTrend.direction === 'up' ? 'text-green-300' : weightTrend.direction === 'down' ? 'text-red-300' : 'text-white/80'}`}>
                  {weightTrend.direction === 'up' ? '↗' : weightTrend.direction === 'down' ? '↘' : '→'}
                </div>
              </div>
              {weightTrend.direction !== 'stable' && (
                <p className="text-white/80 text-xs mt-2">{weightTrend.value}% vs last period</p>
              )}
              <p className="text-white/70 text-xs mt-2 flex items-center">
                Click for details <span className="ml-1">📊</span>
              </p>
            </div>

        <div 
          className="bg-gradient-to-r from-[#51ADA5] to-[#73B5B2] rounded-lg p-6 text-white cursor-pointer transform transition-transform hover:scale-105"
          onClick={() => {
            setDrillDownType('items');
            setShowDrillDown(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total Items</p>
              <p className="text-3xl font-bold">{formatNumberWithCommas(totalItems)}</p>
              <p className="text-white/80 text-xs">items processed</p>
            </div>
            <div className={`text-2xl ${itemsTrend.direction === 'up' ? 'text-green-300' : itemsTrend.direction === 'down' ? 'text-red-300' : 'text-white/80'}`}>
              {itemsTrend.direction === 'up' ? '↗' : itemsTrend.direction === 'down' ? '↘' : '→'}
            </div>
          </div>
          {itemsTrend.direction !== 'stable' && (
            <p className="text-white/80 text-xs mt-2">{itemsTrend.value}% vs last period</p>
          )}
          <p className="text-white/70 text-xs mt-2 flex items-center">
            Click for details <span className="ml-1">📊</span>
          </p>
        </div>

        <div className="bg-gradient-to-r from-[#73B5B2] to-[#9AC5C4] rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Kiosk Transactions</p>
              <p className="text-3xl font-bold">{kioskTransactions}</p>
              <p className="text-white/80 text-xs">customer interactions</p>
            </div>
            <div className="text-2xl text-white/80">🏪</div>
          </div>
          <button
            onClick={() => onTabChange && onTabChange('kiosk-monitoring')}
            className="text-purple-100 text-xs mt-2 hover:text-white transition-colors"
          >
            View Details →
          </button>
        </div>

        <div className="bg-gradient-to-r from-[#51ADA5] to-[#2E888D] rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Warehouse Sessions</p>
              <p className="text-3xl font-bold">{warehouseSessions}</p>
              <p className="text-white/80 text-xs">processing sessions</p>
            </div>
            <div className="text-2xl text-white/80">🏭</div>
          </div>
          <button
            onClick={() => onTabChange && onTabChange('warehouse-operations')}
            className="text-orange-100 text-xs mt-2 hover:text-white transition-colors"
          >
            View Details →
          </button>
        </div>

        <div className="bg-gradient-to-r from-[#C4DAD9] to-[#E4EDEC] rounded-lg p-6 text-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Contamination</p>
              <p className="text-3xl font-bold">{avgContamination}%</p>
              <p className="text-gray-600 text-xs">quality metric</p>
            </div>
            <div className="text-2xl text-gray-600">⚠️</div>
          </div>
          <p className={`text-xs mt-2 ${avgContamination < 3 ? 'text-green-600' : avgContamination < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgContamination < 3 ? 'Excellent' : avgContamination < 5 ? 'Good' : 'Needs Attention'}
          </p>
        </div>
          </>
        )}
      </div>

      {/* Drill-down Modal */}
      {showDrillDown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {drillDownType === 'weight' ? 'Weight' : 'Items'} Breakdown Analysis
                </h2>
                <button
                  onClick={() => setShowDrillDown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Period Selector */}
              <div className="flex space-x-2 mt-4">
                {['daily', 'weekly', 'monthly'].map(period => (
                  <button
                    key={period}
                    onClick={() => setDrillDownPeriod(period)}
                    className={`px-4 py-2 text-sm rounded ${
                      drillDownPeriod === period
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Average {drillDownPeriod}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {drillDownType === 'weight' 
                      ? `${(totalWeight / (drillDownPeriod === 'daily' ? 30 : drillDownPeriod === 'weekly' ? 4 : 1)).toFixed(1)} lbs`
                      : `${Math.round(totalItems / (drillDownPeriod === 'daily' ? 30 : drillDownPeriod === 'weekly' ? 4 : 1))} items`
                    }
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Peak {drillDownPeriod}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {drillDownType === 'weight' 
                      ? `${(totalWeight * 0.15).toFixed(1)} lbs`
                      : `${Math.round(totalItems * 0.15)} items`
                    }
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="text-xl font-bold text-green-600">
                    +{drillDownType === 'weight' ? weightTrend.value : itemsTrend.value}%
                  </p>
                </div>
              </div>
              
              {/* Detailed Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {drillDownPeriod.charAt(0).toUpperCase() + drillDownPeriod.slice(1)} Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(() => {
                    const periods = drillDownPeriod === 'daily' ? 30 : drillDownPeriod === 'weekly' ? 12 : 12;
                    return Array.from({ length: periods }, (_, i) => {
                      const date = new Date();
                      if (drillDownPeriod === 'daily') {
                        date.setDate(date.getDate() - (periods - 1 - i));
                      } else if (drillDownPeriod === 'weekly') {
                        date.setDate(date.getDate() - ((periods - 1 - i) * 7));
                      } else {
                        date.setMonth(date.getMonth() - (periods - 1 - i));
                      }
                      
                      const baseValue = drillDownType === 'weight' ? totalWeight / periods : totalItems / periods;
                      const variation = 0.7 + Math.random() * 0.6;
                      
                      return {
                        date: drillDownPeriod === 'monthly' 
                          ? date.toLocaleDateString('en-US', { month: 'short' })
                          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: Math.round(baseValue * variation * 10) / 10,
                        target: Math.round(baseValue * 10) / 10
                      };
                    });
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip 
                      formatter={(value, name) => [
                        drillDownType === 'weight' ? `${value} lbs` : `${value} items`,
                        name === 'value' ? 'Actual' : 'Target'
                      ]}
                    />
                    <Bar dataKey="value" fill="#3B82F6" name="Actual" />
                    <Bar dataKey="target" fill="#E5E7EB" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Material Breakdown for Weight */}
              {drillDownType === 'weight' && materialChartData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">By Material Type</h3>
                  <div className="space-y-2">
                    {materialChartData.map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{material.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatChartValue(material.value, 'lbs')}</p>
                          <p className="text-sm text-gray-600">
                            {((material.value / totalWeight) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1: Trends and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isResaleTenant ? 'Trade-In Trends' : 'Volume Trends'}
            </h2>
            <div className="flex space-x-2">
              {isResaleTenant ? (
                <>
                  <button
                    onClick={() => setSelectedMetric('items')}
                    className={`px-3 py-1 text-sm rounded ${selectedMetric === 'items' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Submissions
                  </button>
                  <button
                    onClick={() => setSelectedMetric('value')}
                    className={`px-3 py-1 text-sm rounded ${selectedMetric === 'value' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Value
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedMetric('weight')}
                    className={`px-3 py-1 text-sm rounded ${selectedMetric === 'weight' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Weight
                  </button>
                  <button
                    onClick={() => setSelectedMetric('items')}
                    className={`px-3 py-1 text-sm rounded ${selectedMetric === 'items' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Items
                  </button>
                </>
              )}
            </div>
          </div>
                      <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip 
                formatter={(value) => [
                  selectedMetric === 'weight' ? formatChartValue(value, 'lbs') : 
                  selectedMetric === 'value' ? `$${formatNumberWithCommas(value)}` : 
                  `${value} items`,
                  selectedMetric === 'weight' ? 'Weight' : 
                  selectedMetric === 'value' ? 'Value' : 
                  'Items'
                ]}
                wrapperStyle={{ backgroundColor: 'transparent', border: 'none' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{
                        backgroundColor: '#fff',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{label}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#3B82F6' }}>
                          {selectedMetric === 'weight' ? formatChartValue(payload[0].value, 'lbs') : 
                           selectedMetric === 'value' ? `$${formatNumberWithCommas(payload[0].value)}` : 
                           `${payload[0].value} items`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isResaleTenant ? 'Recent Trade-Ins' : 'Live Kiosk Activity'}
            </h2>
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {isResaleTenant ? (
              // Resale recent activity
              dashboardData?.recentActivity?.slice(0, 6).map(activity => (
                <div key={activity.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{activity.submission_code}</p>
                      <p className="text-xs text-gray-600">
                        {activity.item_count} items • ${formatNumberWithCommas(activity.estimated_value)}
                      </p>
                      <p className="text-xs text-blue-600">
                        Status: {activity.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )) || <p className="text-gray-500 text-sm">No recent trade-ins</p>
            ) : (
              // Recycling kiosk activity
              kioskData?.transactions?.slice(0, 6).map(transaction => (
                <div key={transaction.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{transaction.customer_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-600">{transaction.store_location}</p>
                      <p className="text-xs text-blue-600">{transaction.total_points_earned} points earned</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(transaction.transaction_completed_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )) || <p className="text-gray-500 text-sm">No recent transactions</p>
            )}
          </div>
          <button
            onClick={() => onTabChange && onTabChange(isResaleTenant ? 'trade-ins' : 'kiosk-monitoring')}
            className="w-full mt-4 text-blue-600 text-sm hover:text-blue-800 transition-colors"
          >
            View All {isResaleTenant ? 'Trade-Ins' : 'Activity'} →
          </button>
        </div>
      </div>

      {/* Charts Row 2: Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material/Status Breakdown */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isResaleTenant ? 'Trade-In Status' : 'Material Breakdown'}
          </h2>
          {isResaleTenant ? (
            // Resale Status Breakdown
            dashboardData?.statusBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.statusBreakdown.map(item => ({
                      name: item.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      value: item.count,
                      totalValue: item.total_value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [
                    `${value} trade-ins`,
                    `$${formatNumberWithCommas(props.payload.totalValue)}`
                  ]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No status data available
              </div>
            )
          ) : (
            // Recycling Material Breakdown
            materialChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={materialChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {materialChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatChartValue(value, 'lbs')} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No material data available
              </div>
            )
          )}
        </div>

        {/* Program Type / Condition Breakdown */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isResaleTenant ? 'Condition Breakdown' : 'Program Type Distribution'}
          </h2>
          {(() => {
            if (isResaleTenant) {
              // Process condition breakdown data for resale
              const conditionData = (dashboardData?.conditionBreakdown || [])
                .map(item => ({
                  name: item.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  count: item.count,
                  avgValue: Math.round(item.avg_value * 100) / 100
                }))
                .sort((a, b) => b.count - a.count);
              
              return conditionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conditionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'count' ? `${value} items` : `$${formatNumberWithCommas(value)}`,
                        name === 'count' ? 'Items' : 'Avg Value'
                      ]}
                    />
                    <Bar dataKey="count" fill="#3B82F6" name="Items">
                      {conditionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No condition data available
                </div>
              );
            }
            
            // Process program type data with friendly names for recycling
            const programTypeData = (dashboardData?.programTypeBreakdown || [])
              .filter(item => item.program_type && item.weight > 0)
              .map(item => ({
                name: formatProgramType(item.program_type),
                weight: Math.round(parseFloat(item.weight || 0) * 100) / 100,
                count: item.count || 0,
                originalType: item.program_type
              }))
              .sort((a, b) => b.weight - a.weight);
              
            // Helper function to format program types
            function formatProgramType(type) {
              const typeMap = {
                'STORE_DROPOFF': 'In-Store',
                'Store Drop-off': 'In-Store',
                'MAIL_BACK': 'Mail-Back',
                'Mail Back': 'Mail-Back',
                'Take-back Program': 'Mail-Back',
                'IN_OFFICE': 'In Office',
                'Office Collection': 'In Office',
                'OBSOLETE_INVENTORY': 'Obsolete Inventory',
                'Obsolete Stock': 'Obsolete Inventory',
                'WAREHOUSE_PROCESSING': 'Warehouse Processing'
              };
              return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            
            // Define colors for each program type
            const programColors = {
              'In-Store': '#3B82F6',
              'Mail-Back': '#10B981',
              'In Office': '#F59E0B',
              'Obsolete Inventory': '#8B5CF6',
              'Warehouse Processing': '#EF4444'
            };
            
            return programTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={programTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'weight' ? formatChartValue(value, 'lbs') : `${value} items`,
                      name === 'weight' ? 'Weight' : 'Items'
                    ]}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Weight: {formatChartValue(data.weight, 'lbs')}</p>
                            <p className="text-sm">Items: {formatNumberWithCommas(data.count)}</p>
                            <p className="text-sm text-gray-600">
                              {((data.weight / totalWeight) * 100).toFixed(1)}% of total
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="weight" fill="#3B82F6">
                    {programTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={programColors[entry.name] || '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No program type data available
              </div>
            );
          })()}
        </div>
      </div>

      {/* Charts Row 3: Processing Outcomes and Contamination */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Outcomes */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">End-of-Life Outcomes</h2>
          {outcomeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={outcomeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip 
                  wrapperStyle={{ backgroundColor: 'transparent', border: 'none' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{
                          backgroundColor: '#fff',
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{label}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#8B5CF6' }}>
                            {formatChartValue(payload[0].value, 'lbs')}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-gray-500 text-sm">No end-of-life outcome data available</p>
                <p className="text-gray-400 text-xs mt-1">Process materials to see outcome tracking</p>
              </div>
            </div>
          )}
        </div>

        {/* Contamination Rates */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contamination by Material</h2>
          {contaminationChartData.length > 0 ? (
            <>
              <div className="space-y-2">
                {contaminationChartData.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-xs font-medium text-gray-700 truncate mr-2">{item.material}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.rate < 3 ? 'bg-green-500' : 
                            item.rate < 5 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(item.rate * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-10 text-right">{item.rate.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onTabChange && onTabChange('analytics')}
                className="w-full mt-4 text-blue-600 text-sm hover:text-blue-800 transition-colors"
              >
                Full Analytics →
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-gray-500 text-sm">No contamination data available</p>
                <p className="text-gray-400 text-xs mt-1">Process materials to see contamination rates</p>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Regional Material Collection View */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Regional Material Collection</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Collection by Region</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { region: 'Northeast', weight: 3245, stores: 47, efficiency: 89 },
                { region: 'Southeast', weight: 2891, stores: 38, efficiency: 82 },
                { region: 'Midwest', weight: 2156, stores: 31, efficiency: 76 },
                { region: 'Southwest', weight: 1834, stores: 29, efficiency: 71 },
                { region: 'West Coast', weight: 4102, stores: 52, efficiency: 94 },
                { region: 'Canada', weight: 1567, stores: 18, efficiency: 88 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" fontSize={11} angle={-45} textAnchor="end" height={80} />
                <YAxis fontSize={11} label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} label={{ value: 'Stores', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value, name) => [
                  name === 'weight' ? `${Number(value).toLocaleString()} lbs` : 
                  name === 'stores' ? `${value} stores` :
                  `${value}% efficiency`,
                  name === 'weight' ? 'Total Weight' :
                  name === 'stores' ? 'Active Stores' :
                  'Collection Efficiency'
                ]} />
                <Bar dataKey="weight" fill="#3B82F6" name="Weight" />
                <Bar dataKey="stores" fill="#10B981" name="Stores" yAxisId="right" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Regional Performance Summary</h3>
            <div className="space-y-3">
              {[
                { region: 'West Coast', weight: 4102, growth: 12.3, rank: 1, highlight: true },
                { region: 'Northeast', weight: 3245, growth: 8.7, rank: 2, highlight: false },
                { region: 'Southeast', weight: 2891, growth: 5.2, rank: 3, highlight: false },
                { region: 'Midwest', weight: 2156, growth: 2.1, rank: 4, highlight: false },
                { region: 'Southwest', weight: 1834, growth: -1.4, rank: 5, highlight: false },
                { region: 'Canada', weight: 1567, growth: 15.8, rank: 6, highlight: true }
              ].map((region, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  region.highlight ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg font-bold ${
                      region.rank === 1 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      #{region.rank}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">{region.region}</span>
                      <p className="text-sm text-gray-600">{region.weight.toLocaleString()} lbs collected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      region.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {region.growth > 0 ? '+' : ''}{region.growth.toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500 mt-1">YoY Growth</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🌍 Regional Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>Top Performer:</strong> West Coast leads with 4,102 lbs and 12.3% growth, driven by high store density and consumer engagement.
            </div>
            <div>
              <strong>Fastest Growing:</strong> Canada shows 15.8% growth despite smaller scale, indicating strong program adoption.
            </div>
            <div>
              <strong>Opportunity:</strong> Southwest region underperforming with -1.4% growth; recommend targeted store support initiatives.
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={() => onTabChange && onTabChange('data-sources')}
            className="p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm font-medium">Upload Data</p>
          </button>
          <button
            onClick={() => onTabChange && onTabChange('warehouse-operations')}
            className="p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors"
          >
            <div className="text-2xl mb-2">🏭</div>
            <p className="text-sm font-medium">Warehouse</p>
          </button>
          <button
            onClick={() => onTabChange && onTabChange('analytics')}
            className="p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors"
          >
            <div className="text-2xl mb-2">📈</div>
            <p className="text-sm font-medium">Analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 