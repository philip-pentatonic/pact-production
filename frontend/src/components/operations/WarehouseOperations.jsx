import React, { useState, useEffect } from 'react';
import { 
  TruckIcon,
  ClockIcon,
  ScaleIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  EyeIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import SessionDetailModal from '../modals/SessionDetailModal';
import { formatWeight, formatDuration, formatLargeNumber } from '../../utils/formatters';
import { getApiUrl } from '../../config';
import { getTenantInfo } from '../common/TenantSwitcher';
import { useTenant } from '../../contexts/TenantContext';

function WarehouseOperations() {
  const tenant = getTenantInfo();
  const { getApiFilters, selectedMemberId } = useTenant();
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDays, setSelectedDays] = useState(9999); // Default to "All time" for historical PACT data
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [packagesPerPage] = useState(50);
  const [totalPackages, setTotalPackages] = useState(0);
  
  // Custom date range state
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Session detail modal state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDays, selectedStatus, selectedMemberId, currentPage, useCustomDates, startDate, endDate]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDays, selectedStatus, selectedMemberId, useCustomDates, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantCode = localStorage.getItem('activeTenant') || 'pact';
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'X-Tenant-Code': tenantCode
      };
      
      // Get member filter from context
      const apiFilters = getApiFilters();
      
      // Build analytics URL with member filter
      const analyticsParams = new URLSearchParams();
      if (useCustomDates && startDate && endDate) {
        analyticsParams.append('start_date', startDate);
        analyticsParams.append('end_date', endDate);
        analyticsParams.append('days', '9999'); // Set to all time when using custom dates
      } else {
        analyticsParams.append('days', selectedDays);
      }
      if (apiFilters.member_id) {
        analyticsParams.append('member_id', apiFilters.member_id);
      }
      
      // Fetch analytics
      console.log('Fetching analytics with params:', analyticsParams.toString());
      const analyticsUrl = getApiUrl(`/admin/warehouse/analytics?${analyticsParams}`);
      console.log('Analytics URL:', analyticsUrl);
      const analyticsResponse = await fetch(analyticsUrl, {
        headers
      });
      
      // Build packages URL with member filter and pagination
      const packagesParams = new URLSearchParams();
      packagesParams.append('status', selectedStatus);
      if (useCustomDates && startDate && endDate) {
        packagesParams.append('start_date', startDate);
        packagesParams.append('end_date', endDate);
        packagesParams.append('days', '9999');
      } else {
        packagesParams.append('days', selectedDays);
      }
      packagesParams.append('limit', packagesPerPage);
      packagesParams.append('offset', (currentPage - 1) * packagesPerPage);
      if (apiFilters.member_id) {
        packagesParams.append('member_id', apiFilters.member_id);
      }
      
      // Fetch packages
      const packagesResponse = await fetch(getApiUrl(`/admin/warehouse/sessions?${packagesParams}`), {
        headers
      });
      
      // Build activity URL with member filter
      const activityParams = new URLSearchParams();
      activityParams.append('limit', '10');
      if (apiFilters.member_id) {
        activityParams.append('member_id', apiFilters.member_id);
      }
      
      // Fetch recent activity
      const activityResponse = await fetch(getApiUrl(`/admin/warehouse/activity?${activityParams}`), {
        headers
      });
      
      console.log('Analytics response status:', analyticsResponse.status);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        console.log('Analytics data received:', analyticsData);
        console.log('Session stats detail:', analyticsData.sessionStats);
        // The API returns sessionStats, materialBreakdown, operatorPerformance directly
        setAnalytics(analyticsData || {});
      } else {
        const errorText = await analyticsResponse.text();
        console.error('Analytics response error:', analyticsResponse.status, errorText);
        setAnalytics({});
      }
      
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setSessions(packagesData.sessions || []);
        setTotalPackages(packagesData.totalCount || packagesData.sessions?.length || 0);
      } else {
        console.error('Packages response error:', await packagesResponse.text());
        setSessions([]);
        setTotalPackages(0);
      }
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        // The API returns activities, not activity
        setActivity(activityData.activities || []);
      } else {
        console.error('Activity response error:', await activityResponse.text());
        setActivity([]);
      }
      
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      setError('Failed to load warehouse data');
    } finally {
      setLoading(false);
    }
  };

  // formatDuration is now imported from utils

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const openSessionDetail = (sessionId) => {
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
  };

  const closeSessionDetail = () => {
    setSelectedSessionId(null);
    setIsModalOpen(false);
  };

  const handleExportData = async (format = 'csv') => {
    try {
      const token = localStorage.getItem('token');
      const tenantCode = localStorage.getItem('activeTenant') || 'pact';
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'X-Tenant-Code': tenantCode
      };
      
      const params = new URLSearchParams();
      if (useCustomDates && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
        params.append('days', '9999');
      } else {
        params.append('days', selectedDays);
      }
      if (selectedMemberId) {
        params.append('member_id', selectedMemberId);
      }
      params.append('format', format);
      
      const response = await fetch(getApiUrl(`/admin/warehouse/export?${params}`), {
        headers
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `warehouse-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Export failed:', await response.text());
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleExportSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantCode = localStorage.getItem('activeTenant') || 'pact';
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'X-Tenant-Code': tenantCode
      };
      
      const params = new URLSearchParams();
      if (useCustomDates && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
        params.append('days', '9999');
      } else {
        params.append('days', selectedDays);
      }
      if (selectedMemberId) {
        params.append('member_id', selectedMemberId);
      }
      
      const response = await fetch(getApiUrl(`/admin/warehouse/export-summary?${params}`), {
        headers
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `warehouse-summary-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Export summary failed:', await response.text());
      }
    } catch (error) {
      console.error('Export summary error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading warehouse operations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Operations</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                const dropdown = document.getElementById('export-dropdown');
                dropdown.classList.toggle('hidden');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Data
            </button>
            <div
              id="export-dropdown"
              className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    handleExportData('csv');
                    document.getElementById('export-dropdown').classList.add('hidden');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                >
                  Export Raw Data (CSV)
                </button>
                <button
                  onClick={() => {
                    handleExportData('json');
                    document.getElementById('export-dropdown').classList.add('hidden');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                >
                  Export Raw Data (JSON)
                </button>
                <button
                  onClick={() => {
                    handleExportSummary();
                    document.getElementById('export-dropdown').classList.add('hidden');
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                >
                  Export Summary (CSV)
                </button>
              </div>
            </div>
          </div>
          {/* Date range selector */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={useCustomDates ? 'custom' : selectedDays}
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
                  setSelectedDays(parseInt(value));
                }
              }}
              className="block w-44 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <optgroup label="Recent">
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 2 weeks</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </optgroup>
              <optgroup label="Monthly">
                <option value={-202501}>January 2025</option>
                <option value={-202412}>December 2024</option>
                <option value={-202411}>November 2024</option>
                <option value={-202410}>October 2024</option>
              </optgroup>
              <optgroup label="Yearly">
                <option value={-2021}>2021</option>
                <option value={-2022}>2022</option>
                <option value={-2023}>2023</option>
                <option value={-2024}>2024</option>
                <option value={-2025}>2025</option>
              </optgroup>
              <option value={9999}>All time</option>
              <option value="custom">Custom range...</option>
            </select>
            
            {/* Custom date pickers */}
            {useCustomDates && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Start date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="End date"
                />
              </>
            )}
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Sessions</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      {analytics?.sessionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Sessions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.sessionStats.total_sessions || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.sessionStats.completed_sessions || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Processing Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.sessionStats.avg_processing_time_minutes 
                        ? `${(analytics.sessionStats.avg_processing_time_minutes / (24 * 60)).toFixed(1)} days`
                        : 'N/A'}
                    </dd>
                    {analytics.sessionStats.avg_processing_time_minutes_recent && (
                      <dd className="text-sm text-gray-500 mt-1">
                        Last 12 months: {(analytics.sessionStats.avg_processing_time_minutes_recent / (24 * 60)).toFixed(1)} days
                      </dd>
                    )}
                    {analytics.sessionStats.avg_processing_time_minutes > 10000 && (
                      <dd className="text-xs text-gray-400 mt-1">
                        Includes historical data
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ScaleIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Weight (lbs)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatWeight(analytics.sessionStats.total_weight_processed || 0, 'lbs')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Contamination
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.sessionStats.avg_contamination_rate 
                        ? `${(analytics.sessionStats.avg_contamination_rate * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </dd>
                    {analytics.sessionStats.total_contamination_weight > 0 && (
                      <dd className="text-sm text-gray-500 mt-1">
                        {formatWeight(analytics.sessionStats.total_contamination_weight, 'lbs')} contaminated
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Alerts & Thresholds */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
          Processing Alerts & Thresholds
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Processing Time Alert</h4>
                <p className="text-xs text-yellow-600 mt-1">Threshold: &gt;48 hours</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-yellow-800">7</span>
              <span className="text-sm text-yellow-600 ml-1">packages overdue</span>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <TruckIcon className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Queue Backlog Alert</h4>
                <p className="text-xs text-red-600 mt-1">Threshold: &gt;100 packages</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-red-800">142</span>
              <span className="text-sm text-red-600 ml-1">in queue</span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <BeakerIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Quality Alert</h4>
                <p className="text-xs text-blue-600 mt-1">Threshold: &gt;5% contamination</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-blue-800">3</span>
              <span className="text-sm text-blue-600 ml-1">batches flagged</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-yellow-800">
                Package KIEHLS-2024-7832 has been processing for 3 days
              </span>
            </div>
            <button className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded text-yellow-800">
              Investigate
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-800">
                Processing queue has exceeded capacity threshold (142/100)
              </span>
            </div>
            <button className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-red-800">
              View Queue
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <div className="flex items-center">
              <BeakerIcon className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Batch B-2024-0703-A shows 8.3% contamination rate
              </span>
            </div>
            <button className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-blue-800">
              Review Batch
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-600">
          <p>💡 Alerts are automatically generated when processing times, queue sizes, or quality metrics exceed predefined thresholds. Configure notification settings in the admin panel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All Packages */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  All Packages
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {totalPackages} total packages
                  </span>
                  {totalPackages > packagesPerPage && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {Math.ceil(totalPackages / packagesPerPage)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(Math.ceil(totalPackages / packagesPerPage), currentPage + 1))}
                        disabled={currentPage >= Math.ceil(totalPackages / packagesPerPage)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {sessions.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Package ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processing Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weight
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collection Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.map((session) => (
                        <tr 
                          key={session.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openSessionDetail(session.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {session.tracking_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.member_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(session.status || 'unknown')}>
                              {(session.status || 'unknown').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.package_weight ? formatWeight(session.package_weight, 'lbs') : 
                             session.total_weight ? formatWeight(session.total_weight, 'lbs') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.collection_date ? formatDate(session.collection_date) : 
                             session.started_at ? formatDate(session.started_at) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openSessionDetail(session.id);
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {selectedMemberId ? 'No packages found for selected member' : 'No packages found'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Material Types Breakdown */}
        <div>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Weight Breakdown Analysis
                </h3>
                <div className="flex items-center text-xs text-gray-500">
                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                  <span>
                    {useCustomDates && startDate && endDate
                      ? `Filtered by: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                      : 'Filtered by selected date range'}
                  </span>
                </div>
              </div>
              
              {analytics?.materialBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {/* Total summary */}
                  <div className="border-b pb-3 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Weight</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatWeight(
                          analytics.materialBreakdown.reduce((sum, m) => sum + (m.total_weight || 0), 0),
                          'lbs'
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {analytics.materialBreakdown.slice(0, 8).map((material) => (
                    <div key={material.material_type} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {material.material_type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {material.count} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatWeight(material.total_weight || 0, 'lbs')}
                        </p>
                        <p className="text-xs text-gray-500">
                          avg {formatWeight(material.avg_weight || 0, 'lbs')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {analytics.materialBreakdown.length > 8 && (
                    <div className="pt-2 text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View all {analytics.materialBreakdown.length} materials
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No material data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          
          {activity && activity.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {activity.map((item, index) => (
                  <li key={item.id}>
                    <div className="relative pb-8">
                      {index !== activity.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            item.status === 'completed' 
                              ? 'bg-green-500' 
                              : item.status === 'in_progress'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }`}>
                            {item.status === 'completed' ? (
                              <CheckCircleIcon className="w-5 h-5 text-white" />
                            ) : (
                              <ClockIcon className="w-5 h-5 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">
                                {item.operator_name || 'Unknown operator'}
                              </span> {item.status === 'completed' ? 'completed' : 'started'} processing{' '}
                              <span className="font-medium text-gray-900">
                                {item.tracking_number}
                              </span>
                              {item.member_name && ` for ${item.member_name}`}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime={item.started_at}>
                              {formatDate(item.started_at)}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* Daily Volume Chart (Simple bars for now) */}
      {false && analytics?.dailyVolume?.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Daily Processing Volume
            </h3>
            
            <div className="space-y-3">
              {analytics.dailyVolume.slice(0, 14).map((day) => (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-20 text-sm text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="bg-blue-500 h-4 rounded"
                        style={{ 
                          width: `${Math.max(5, (day.total_weight || 0) * 2)}px`,
                          maxWidth: '200px'
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        {formatWeight(day.total_weight || 0, 'lbs')} ({day.session_count} sessions)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSessionId && (
        <SessionDetailModal
          isOpen={isModalOpen}
          onClose={closeSessionDetail}
          sessionId={selectedSessionId}
        />
      )}
    </div>
  );
}

export default WarehouseOperations; 