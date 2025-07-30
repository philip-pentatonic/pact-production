import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { formatDate, formatWeight, formatPercent, formatNumber } from '@/utils/format';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';
import TrendChart from '@/components/TrendChart';
import MaterialBreakdown from '@/components/MaterialBreakdown';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  // Fetch summary data
  const { data: summary } = useQuery({
    queryKey: ['reports-summary', dateRange],
    queryFn: async () => {
      const response = await axios.get('/api/reports/summary', {
        params: dateRange
      });
      return response.data.data;
    }
  });

  // Fetch trends
  const { data: trends } = useQuery({
    queryKey: ['reports-trends', dateRange],
    queryFn: async () => {
      const response = await axios.get('/api/reports/trends', {
        params: {
          ...dateRange,
          group_by: 'week'
        }
      });
      return response.data.data;
    }
  });

  // Fetch materials
  const { data: materials } = useQuery({
    queryKey: ['reports-materials', dateRange],
    queryFn: async () => {
      const response = await axios.get('/api/reports/materials', {
        params: dateRange
      });
      return response.data.data;
    }
  });

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`/api/reports/${type}`, {
        params: {
          ...dateRange,
          format: 'csv'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analytics and insights for recycling operations
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md border border-gray-300">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="border-0 focus:ring-0 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="border-0 focus:ring-0 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Weight</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatWeight(summary?.total_weight || 0)}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {formatNumber(summary?.total_packages || 0)} packages
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Diversion Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {formatPercent(summary?.diversion_rate || 0)}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {formatWeight(summary?.recyclable_weight || 0)} recycled
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Contamination Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {formatPercent(summary?.contamination_rate || 0)}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {formatWeight(summary?.contamination_weight || 0)} contaminated
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Partners</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {summary?.total_members || 0}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {summary?.total_stores || 0} stores
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Weight Trends</h2>
            <button
              onClick={() => handleExport('trends')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
              Export
            </button>
          </div>
          <TrendChart data={trends || []} />
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Material Distribution</h2>
            <button
              onClick={() => handleExport('materials')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
              Export
            </button>
          </div>
          <MaterialBreakdown data={materials || []} />
        </div>
      </div>

      {/* Top Materials Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Top Materials</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Packages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contamination Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials?.slice(0, 10).map((material, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {material.material}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatWeight(material.total_weight)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(material.packages)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPercent(material.contamination_rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}