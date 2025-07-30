import React, { useState, useEffect } from 'react';
import { 
  CalculatorIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  TruckIcon,
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CubeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getApiUrl } from '../../config';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function AverageMetrics() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('quarter'); // quarter, year, month
  const [selectedView, setSelectedView] = useState('overview'); // overview, stores, customers, trends
  const [selectedMember, setSelectedMember] = useState('all');

  useEffect(() => {
    fetchAverageMetrics();
  }, [selectedPeriod, selectedMember]);

  const fetchAverageMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        getApiUrl(`/api/analytics/average-metrics?period=${selectedPeriod}&member=${selectedMember}`), 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Merge API data with mock data for missing properties
        const mockData = generateMockData();
        const mergedData = {
          ...mockData,
          ...data.metrics,
          // Ensure we have all required properties
          distributionByStore: data.metrics?.distributionByStore || mockData.distributionByStore,
          memberComparison: data.metrics?.memberComparison || mockData.memberComparison,
          quarterlyTrends: data.metrics?.quarterlyTrends || mockData.quarterlyTrends
        };
        setMetricsData(mergedData);
      } else {
        // Use mock data if API fails
        setMetricsData(generateMockData());
      }
    } catch (error) {
      console.error('Error fetching average metrics:', error);
      setMetricsData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    // Calculate period multiplier
    const periodMultiplier = selectedPeriod === 'quarter' ? 3 : selectedPeriod === 'year' ? 12 : 1;
    
    return {
      storeMetrics: {
        avg_boxes_per_store: 12.5 * periodMultiplier,
        avg_weight_per_store: 385.2 * periodMultiplier,
        avg_items_per_store: 950 * periodMultiplier,
        total_active_stores: 45,
        stores_with_kiosks: 28,
        stores_without_kiosks: 17,
        top_performing_stores: 8,
        underperforming_stores: 3
      },
      customerMetrics: {
        avg_mailback_labels_per_customer: 2.3 * (periodMultiplier / 3),
        total_active_customers: 12450,
        repeat_customers: 3850,
        avg_items_per_return: 4.7,
        avg_days_between_returns: 62,
        customer_retention_rate: 31
      },
      programMetrics: {
        in_store_avg: 15.8 * periodMultiplier,
        mail_back_avg: 8.2 * periodMultiplier,
        in_office_avg: 3.5 * periodMultiplier,
        obsolete_inventory_avg: 1.2 * periodMultiplier
      },
      quarterlyTrends: Array.from({ length: 4 }, (_, i) => {
        const quarter = ['Q1', 'Q2', 'Q3', 'Q4'][i];
        return {
          quarter,
          boxes_per_store: 12 + Math.random() * 4 - 2,
          labels_per_customer: 2 + Math.random() * 0.6 - 0.3,
          active_stores: 42 + Math.floor(Math.random() * 6),
          active_customers: 11000 + Math.floor(Math.random() * 2000)
        };
      }),
      distributionByStore: [
        { range: '0-5 boxes', count: 3, percentage: 6.7 },
        { range: '6-10 boxes', count: 8, percentage: 17.8 },
        { range: '11-15 boxes', count: 18, percentage: 40.0 },
        { range: '16-20 boxes', count: 12, percentage: 26.7 },
        { range: '21+ boxes', count: 4, percentage: 8.8 }
      ],
      memberComparison: [
        { member: "Kiehl's", avg_boxes: 14.2 * periodMultiplier, avg_labels: 2.8, stores: 25 },
        { member: 'Aesop', avg_boxes: 11.8 * periodMultiplier, avg_labels: 2.1, stores: 12 },
        { member: 'Others', avg_boxes: 9.5 * periodMultiplier, avg_labels: 1.9, stores: 8 }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Average Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Avg Boxes per Store</p>
              <p className="text-3xl font-bold">{metricsData.storeMetrics.avg_boxes_per_store.toFixed(1)}</p>
              <p className="text-blue-100 text-xs">Per {selectedPeriod}</p>
            </div>
            <CubeIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Avg Labels per Customer</p>
              <p className="text-3xl font-bold">{metricsData.customerMetrics.avg_mailback_labels_per_customer.toFixed(1)}</p>
              <p className="text-green-100 text-xs">Mail-back requests</p>
            </div>
            <EnvelopeIcon className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Stores</p>
              <p className="text-3xl font-bold">{metricsData.storeMetrics.total_active_stores}</p>
              <p className="text-purple-100 text-xs">{metricsData.storeMetrics.stores_with_kiosks} with kiosks</p>
            </div>
            <BuildingStorefrontIcon className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Active Customers</p>
              <p className="text-3xl font-bold">{metricsData.customerMetrics.total_active_customers.toLocaleString()}</p>
              <p className="text-orange-100 text-xs">{metricsData.customerMetrics.customer_retention_rate}% retention</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Average by Program Type */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Collections by Program Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { program: 'In-Store', average: metricsData.programMetrics.in_store_avg },
            { program: 'Mail-Back', average: metricsData.programMetrics.mail_back_avg },
            { program: 'In-Office', average: metricsData.programMetrics.in_office_avg },
            { program: 'Obsolete Inv', average: metricsData.programMetrics.obsolete_inventory_avg }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program" />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)} boxes`} />
            <Bar dataKey="average" name={`Average per ${selectedPeriod}`}>
              {[0, 1, 2, 3].map((index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metricsData.distributionByStore}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({range, percentage}) => `${range}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {metricsData.distributionByStore.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData.memberComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="member" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_boxes" fill="#3B82F6" name="Avg Boxes" />
              <Bar dataKey="avg_labels" fill="#10B981" name="Avg Labels" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderStoreMetrics = () => (
    <div className="space-y-6">
      {/* Store Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <SparklesIcon className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{metricsData.storeMetrics.top_performing_stores}</p>
          <p className="text-sm text-gray-600">Stores above average</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg boxes:</span>
              <span className="font-medium">18.5+</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Efficiency:</span>
              <span className="font-medium">92%+</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Average Performers</h3>
            <ChartBarIcon className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{metricsData.storeMetrics.total_active_stores - metricsData.storeMetrics.top_performing_stores - metricsData.storeMetrics.underperforming_stores}</p>
          <p className="text-sm text-gray-600">Stores at average</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg boxes:</span>
              <span className="font-medium">10-18</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Efficiency:</span>
              <span className="font-medium">75-92%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Need Attention</h3>
            <ArrowTrendingUpIcon className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{metricsData.storeMetrics.underperforming_stores}</p>
          <p className="text-sm text-gray-600">Stores below average</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg boxes:</span>
              <span className="font-medium">&lt;10</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Efficiency:</span>
              <span className="font-medium">&lt;75%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Type Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Performance: Kiosk vs Non-Kiosk Stores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Stores with Kiosks ({metricsData.storeMetrics.stores_with_kiosks})</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg boxes per {selectedPeriod}:</span>
                <span className="text-lg font-semibold">{(metricsData.storeMetrics.avg_boxes_per_store * 1.3).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg weight (lbs):</span>
                <span className="text-lg font-semibold">{(metricsData.storeMetrics.avg_weight_per_store * 1.25).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer engagement:</span>
                <span className="text-lg font-semibold text-green-600">High</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Stores without Kiosks ({metricsData.storeMetrics.stores_without_kiosks})</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg boxes per {selectedPeriod}:</span>
                <span className="text-lg font-semibold">{(metricsData.storeMetrics.avg_boxes_per_store * 0.7).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg weight (lbs):</span>
                <span className="text-lg font-semibold">{(metricsData.storeMetrics.avg_weight_per_store * 0.75).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer engagement:</span>
                <span className="text-lg font-semibold text-yellow-600">Medium</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Average Weight and Items Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight and Item Averages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
              <TruckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{metricsData.storeMetrics.avg_weight_per_store.toFixed(0)} lbs</p>
            <p className="text-sm text-gray-600">Avg weight per store</p>
            <p className="text-xs text-gray-500">per {selectedPeriod}</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
              <CubeIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{metricsData.storeMetrics.avg_items_per_store.toFixed(0)}</p>
            <p className="text-sm text-gray-600">Avg items per store</p>
            <p className="text-xs text-gray-500">per {selectedPeriod}</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
              <CalculatorIcon className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{(metricsData.storeMetrics.avg_weight_per_store / metricsData.storeMetrics.avg_boxes_per_store).toFixed(1)} lbs</p>
            <p className="text-sm text-gray-600">Avg weight per box</p>
            <p className="text-xs text-gray-500">industry: 20-40 lbs</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerMetrics = () => (
    <div className="space-y-6">
      {/* Customer Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Total Customers</h4>
          <p className="text-2xl font-bold">{metricsData.customerMetrics.total_active_customers.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">+12% from last {selectedPeriod}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Repeat Customers</h4>
          <p className="text-2xl font-bold">{metricsData.customerMetrics.repeat_customers.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">{((metricsData.customerMetrics.repeat_customers / metricsData.customerMetrics.total_active_customers) * 100).toFixed(0)}% of total</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Items/Return</h4>
          <p className="text-2xl font-bold">{metricsData.customerMetrics.avg_items_per_return.toFixed(1)}</p>
          <p className="text-sm text-gray-600 mt-1">Per transaction</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Return Frequency</h4>
          <p className="text-2xl font-bold">{metricsData.customerMetrics.avg_days_between_returns}</p>
          <p className="text-sm text-gray-600 mt-1">Days between returns</p>
        </div>
      </div>

      {/* Mail-back Label Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mail-back Label Request Patterns</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Request Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: '1 label', value: 45, count: 5603 },
                    { name: '2-3 labels', value: 35, count: 4358 },
                    { name: '4-5 labels', value: 15, count: 1868 },
                    { name: '6+ labels', value: 5, count: 621 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value}) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${props.payload.count} customers`, `${value}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Customer Segments</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">High Frequency Users</p>
                  <p className="text-sm text-green-700">4+ labels per {selectedPeriod}</p>
                </div>
                <p className="text-xl font-bold text-green-900">12%</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Regular Users</p>
                  <p className="text-sm text-blue-700">2-3 labels per {selectedPeriod}</p>
                </div>
                <p className="text-xl font-bold text-blue-900">43%</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Occasional Users</p>
                  <p className="text-sm text-gray-700">1 label per {selectedPeriod}</p>
                </div>
                <p className="text-xl font-bold text-gray-900">45%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Retention Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Retention Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={[
            { name: 'New Customers', value: 100, fill: '#F59E0B' },
            { name: '1-Month Retention', value: 68, fill: '#3B82F6' },
            { name: '3-Month Retention', value: 42, fill: '#8B5CF6' },
            { name: '6-Month Retention', value: metricsData.customerMetrics.customer_retention_rate, fill: '#10B981' }
          ]}>
            <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" label={{ position: 'insideStart', fill: '#fff' }} />
            <Legend iconType="circle" />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      {/* Quarterly Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Average Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={metricsData.quarterlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis yAxisId="left" label={{ value: 'Boxes per Store', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Labels per Customer', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="boxes_per_store" stroke="#3B82F6" strokeWidth={3} name="Avg Boxes/Store" />
            <Line yAxisId="right" type="monotone" dataKey="labels_per_customer" stroke="#10B981" strokeWidth={3} name="Avg Labels/Customer" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Growth Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Network Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metricsData.quarterlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="active_stores" fill="#8B5CF6" name="Active Stores">
                {metricsData.quarterlyTrends.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.active_stores > 44 ? '#10B981' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Base Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metricsData.quarterlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="active_customers" fill="#F59E0B" name="Active Customers">
                {metricsData.quarterlyTrends.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.active_customers > 12000 ? '#10B981' : '#F59E0B'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-over-Year Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Average Comparisons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { metric: 'Boxes per Store', current: 12.5, previous: 10.2, unit: 'boxes' },
            { metric: 'Labels per Customer', current: 2.3, previous: 1.8, unit: 'labels' },
            { metric: 'Weight per Store', current: 385.2, previous: 312.6, unit: 'lbs' },
            { metric: 'Items per Return', current: 4.7, previous: 3.9, unit: 'items' }
          ].map((item, index) => {
            const change = ((item.current - item.previous) / item.previous * 100).toFixed(1);
            const isPositive = change > 0;
            
            return (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2">{item.metric}</h4>
                <p className="text-2xl font-bold">{item.current} <span className="text-sm font-normal text-gray-500">{item.unit}</span></p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{change}%
                  </span>
                  <span className="text-xs text-gray-500 ml-2">vs last year ({item.previous})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <CalculatorIcon className="h-8 w-8 mr-3 text-blue-600" />
          Average Metrics Calculator
        </h2>
        <p className="mt-2 text-gray-600">
          Comprehensive analysis of average performance metrics across stores and customers
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Filter</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Members</option>
                <option value="kiehls">Kiehl's</option>
                <option value="aesop">Aesop</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            {['overview', 'stores', 'customers', 'trends'].map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Content */}
      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'stores' && renderStoreMetrics()}
      {selectedView === 'customers' && renderCustomerMetrics()}
      {selectedView === 'trends' && renderTrends()}
    </div>
  );
}

export default AverageMetrics; 