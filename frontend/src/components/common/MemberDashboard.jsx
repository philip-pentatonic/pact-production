import React, { useState, useEffect } from 'react';

import { getApiUrl } from '../../config';
function MemberDashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (user?.member_id) {
      fetchStores();
      fetchDashboardData();
    }
  }, [user, selectedStore, startDate, endDate]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/stores?member_id=${user.member_id}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stores');
      const data = await response.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('member_id', user.member_id);
      if (selectedStore) params.append('store_id', selectedStore);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await fetch(getApiUrl(`/data?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      setDashboardData(result.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      showNotification('No data to export', 'error');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Data exported successfully!', 'success');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  if (!dashboardData) return <div className="text-center p-4">No data available</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600 text-white' :
          notification.type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Member Dashboard</h1>
      
      {/* Member Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-lg">
          <span className="font-semibold">Member:</span> {user.name || user.email}
        </p>
        {stores.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Managing {stores.length} store{stores.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stores.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.store_name} ({store.store_code || 'No code'})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedStore('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Total Pounds Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Your Total Recycling Impact
            </h2>
            <p className="text-4xl font-bold text-green-600">
              {dashboardData.totalLbsCollected.toLocaleString()} lbs
            </p>
            <p className="text-sm text-green-700 mt-2">
              That's equivalent to saving {Math.round(dashboardData.totalLbsCollected * 0.017)} trees!
            </p>
          </div>
        </div>
      </div>

      {/* Store Performance (if store admin) */}
      {user.role === 'store_manager' && user.store_id && (
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Store Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardData.materialBreakdown.reduce((sum, m) => sum + m.item_count, 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Material Types</p>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardData.materialBreakdown.length}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Programs Active</p>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardData.programTypeBreakdown.filter(p => p.program_type).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Material Breakdown */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Material Breakdown</h2>
          <button
            onClick={() => exportToCSV(dashboardData.materialBreakdown, `${user.name || 'member'}_materials`)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Material Type
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Weight (lbs)
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData.materialBreakdown.map((material, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {material.material_type || 'Unknown'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {material.total_weight.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {material.item_count}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {((material.total_weight / dashboardData.totalLbsCollected) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustainability Metrics */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800 mb-4">Environmental Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-green-700">CO₂ Emissions Prevented</p>
            <p className="text-2xl font-bold text-green-800">
              {Math.round(dashboardData.totalLbsCollected * 2.2)} lbs
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700">Energy Saved</p>
            <p className="text-2xl font-bold text-green-800">
              {Math.round(dashboardData.totalLbsCollected * 5.5)} kWh
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700">Landfill Space Saved</p>
            <p className="text-2xl font-bold text-green-800">
              {Math.round(dashboardData.totalLbsCollected * 0.033)} yd³
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberDashboard; 