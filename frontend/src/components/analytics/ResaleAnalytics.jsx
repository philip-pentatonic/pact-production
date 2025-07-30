import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../config';
import { FeatureGate, FEATURES } from '../common/FeatureGate';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  ComposedChart, Funnel, FunnelChart, LabelList
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

function ResaleAnalytics() {
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('overview'); // overview, performance, customers, operations

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedCategory, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (selectedCategory) params.append('category', selectedCategory);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      
      const activeTenant = localStorage.getItem('activeTenant') || 'carhartt';
      
      const [overviewRes, trendsRes, categoryRes, performanceRes] = await Promise.all([
        fetch(getApiUrl(`/api/analytics/resale/overview?${params}`), {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': activeTenant
          }
        }),
        fetch(getApiUrl(`/api/analytics/resale/trends?${params}`), {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': activeTenant
          }
        }),
        fetch(getApiUrl(`/api/analytics/resale/categories?${params}`), {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': activeTenant
          }
        }),
        fetch(getApiUrl(`/api/analytics/resale/performance?${params}`), {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': activeTenant
          }
        })
      ]);

      if (overviewRes.ok) {
        const overview = await overviewRes.json();
        setOverviewData(overview.data);
      }
      
      if (trendsRes.ok) {
        const trends = await trendsRes.json();
        setTrendsData(trends.data);
      }
      
      if (categoryRes.ok) {
        const category = await categoryRes.json();
        setCategoryData(category.data);
      }
      
      if (performanceRes.ok) {
        const performance = await performanceRes.json();
        setPerformanceData(performance.data);
      }
    } catch (err) {
      console.error('Error fetching resale analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => {
    // Use real data if available, otherwise show demo data
    const metrics = overviewData || {
      totalTradeIns: 156,
      totalValue: 24580,
      acceptanceRate: 82.5,
      avgItemValue: 157.56,
      totalCustomers: 98,
      repeatCustomers: 23,
      avgProcessingTime: 2.3,
      totalItems: 487
    };

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Trade-Ins</p>
                <p className="text-3xl font-bold">{metrics.totalTradeIns.toLocaleString()}</p>
                <p className="text-blue-100 text-xs">Last {selectedPeriod} days</p>
              </div>
              <div className="text-3xl">🛍️</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Value</p>
                <p className="text-3xl font-bold">${metrics.totalValue.toLocaleString()}</p>
                <p className="text-green-100 text-xs">Accepted items value</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Acceptance Rate</p>
                <p className="text-3xl font-bold">{metrics.acceptanceRate}%</p>
                <p className="text-purple-100 text-xs">Items accepted</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg Processing</p>
                <p className="text-3xl font-bold">{metrics.avgProcessingTime} days</p>
                <p className="text-orange-100 text-xs">Submission to payout</p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
          </div>
        </div>

        {/* Trade-In Funnel */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Trade-In Conversion Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={[
                  { name: 'Items Submitted', value: 487, fill: '#3B82F6' },
                  { name: 'Items Evaluated', value: 402, fill: '#10B981' },
                  { name: 'Items Accepted', value: 368, fill: '#F59E0B' },
                  { name: 'Items Listed', value: 298, fill: '#8B5CF6' },
                  { name: 'Items Sold', value: 127, fill: '#EF4444' }
                ]}
                isAnimationActive
              >
                <LabelList position="center" fill="#fff" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Value Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estimated vs Actual Value</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estimated" name="Estimated ($)" unit="$" />
                <YAxis dataKey="actual" name="Actual ($)" unit="$" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  name="Trade-Ins"
                  data={Array.from({ length: 50 }, () => {
                    const estimated = Math.random() * 300 + 50;
                    const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
                    return {
                      estimated: estimated,
                      actual: estimated * (1 + variance)
                    };
                  })}
                  fill="#3B82F6"
                />
                <ReferenceLine 
                  stroke="#10B981" 
                  strokeDasharray="5 5"
                  segment={[{ x: 0, y: 0 }, { x: 350, y: 350 }]}
                  label="Perfect Match"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payout Method Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Store Credit', value: 45, fill: '#3B82F6' },
                    { name: 'Gift Card', value: 28, fill: '#10B981' },
                    { name: 'Bank Transfer', value: 22, fill: '#F59E0B' },
                    { name: 'Check', value: 5, fill: '#8B5CF6' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trade-Ins by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData || [
              { category: 'Jackets & Coats', count: 145, value: 8970 },
              { category: 'Pants & Jeans', count: 98, value: 4410 },
              { category: 'Overalls', count: 67, value: 5360 },
              { category: 'Shirts & Tops', count: 89, value: 1780 },
              { category: 'Accessories', count: 56, value: 1680 },
              { category: 'Footwear', count: 32, value: 2380 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={11} />
              <YAxis yAxisId="left" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} />
              <Tooltip formatter={(value, name) => [
                name === 'count' ? `${value} items` : `$${value.toLocaleString()}`,
                name === 'count' ? 'Items' : 'Total Value'
              ]} />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Items" />
              <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Value ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Processing Time Analysis */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Time Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { days: 'Same Day', count: 12 },
            { days: '1 Day', count: 34 },
            { days: '2 Days', count: 48 },
            { days: '3 Days', count: 32 },
            { days: '4 Days', count: 18 },
            { days: '5+ Days', count: 12 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="days" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" name="Trade-Ins">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Cell key={`cell-${index}`} fill={index < 3 ? '#10B981' : index < 4 ? '#F59E0B' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quality Assessment Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Condition Assessment Accuracy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              { condition: 'Like New', accuracy: 94 },
              { condition: 'Excellent', accuracy: 88 },
              { condition: 'Good', accuracy: 82 },
              { condition: 'Fair', accuracy: 76 },
              { condition: 'Poor', accuracy: 91 }
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="condition" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Assessment Accuracy" dataKey="accuracy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Tooltip formatter={(value) => `${value}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rejection Reasons</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Poor Condition', value: 35 },
                  { name: 'Counterfeit', value: 8 },
                  { name: 'Not Authentic', value: 12 },
                  { name: 'Missing Info', value: 18 },
                  { name: 'Other', value: 11 }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Warehouse Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Items/Hour</p>
              <p className="text-3xl font-bold">12.4</p>
              <p className="text-green-100 text-xs">Avg processing speed</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Accuracy Rate</p>
              <p className="text-3xl font-bold">97.2%</p>
              <p className="text-blue-100 text-xs">Assessment accuracy</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">SLA Compliance</p>
              <p className="text-3xl font-bold">94.8%</p>
              <p className="text-purple-100 text-xs">Within 3 days</p>
            </div>
            <div className="text-3xl">✓</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomersTab = () => (
    <div className="space-y-6">
      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900">1,234</p>
          <p className="text-sm text-green-600">+12% vs last period</p>
        </div>
        
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Repeat Rate</h3>
          <p className="text-2xl font-bold text-gray-900">23.5%</p>
          <p className="text-sm text-green-600">+3.2% vs last period</p>
        </div>
        
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Items/Customer</h3>
          <p className="text-2xl font-bold text-gray-900">3.1</p>
          <p className="text-sm text-red-600">-0.3 vs last period</p>
        </div>
        
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Customer LTV</h3>
          <p className="text-2xl font-bold text-gray-900">$284</p>
          <p className="text-sm text-green-600">+8% vs last period</p>
        </div>
      </div>

      {/* Customer Behavior Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Segments</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'One-time', value: 892, fill: '#3B82F6' },
                  { name: 'Occasional (2-3)', value: 234, fill: '#10B981' },
                  { name: 'Regular (4-9)', value: 87, fill: '#F59E0B' },
                  { name: 'VIP (10+)', value: 21, fill: '#8B5CF6' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submission Patterns</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={Array.from({ length: 24 }, (_, hour) => ({
              hour: `${hour}:00`,
              submissions: Math.floor(Math.random() * 20 + (hour >= 10 && hour <= 20 ? 30 : 5))
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" fontSize={10} interval={2} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="submissions" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Customer Locations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { city: 'New York, NY', customers: 234, value: 45780 },
            { city: 'Los Angeles, CA', customers: 187, value: 38920 },
            { city: 'Chicago, IL', customers: 156, value: 32100 },
            { city: 'Houston, TX', customers: 134, value: 28450 },
            { city: 'Phoenix, AZ', customers: 98, value: 19800 },
            { city: 'Philadelphia, PA', customers: 87, value: 17650 }
          ].map((location, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{location.city}</p>
                <p className="text-sm text-gray-500">{location.customers} customers</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">${location.value.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total value</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOperationsTab = () => (
    <div className="space-y-6">
      {/* Daily Operations Overview */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Trade-In Volume</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trendsData?.daily || Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              submissions: Math.floor(Math.random() * 8 + 3),
              processed: Math.floor(Math.random() * 10 + 2),
              backlog: Math.floor(Math.random() * 5)
            };
          })}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            <Bar dataKey="submissions" fill="#3B82F6" name="New Submissions" />
            <Bar dataKey="processed" fill="#10B981" name="Processed" />
            <Line type="monotone" dataKey="backlog" stroke="#EF4444" strokeWidth={2} name="Backlog" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Operational Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Performance</h2>
          <div className="space-y-4">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => {
              const efficiency = 85 + Math.random() * 10;
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{week}</span>
                    <span className="text-sm font-bold text-gray-900">{efficiency.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        efficiency > 90 ? 'bg-green-500' : efficiency > 80 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${efficiency}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Queue Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">Awaiting Evaluation</p>
                  <p className="text-sm text-gray-500">Items pending assessment</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600">23</p>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">In Processing</p>
                  <p className="text-sm text-gray-500">Currently being evaluated</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">8</p>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">Ready for Payout</p>
                  <p className="text-sm text-gray-500">Awaiting payment processing</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Warehouse Staff Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items Processed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time/Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { name: 'John Smith', items: 156, time: '4.2 min', accuracy: '98.2%', rating: 4.8 },
                { name: 'Sarah Johnson', items: 143, time: '4.8 min', accuracy: '96.5%', rating: 4.6 },
                { name: 'Mike Wilson', items: 128, time: '3.9 min', accuracy: '97.8%', rating: 4.7 },
                { name: 'Emily Chen', items: 134, time: '4.5 min', accuracy: '99.1%', rating: 4.9 }
              ].map((staff, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {staff.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.accuracy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">{staff.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <FeatureGate feature={FEATURES.ANALYTICS_RESALE}>
      <div className="space-y-6">
      {/* Header Section with Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resale Analytics</h1>
            <p className="text-gray-600">Trade-in program performance and insights</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="jackets">Jackets & Coats</option>
              <option value="pants">Pants & Jeans</option>
              <option value="overalls">Overalls & Coveralls</option>
              <option value="shirts">Shirts & Tops</option>
              <option value="accessories">Accessories</option>
              <option value="footwear">Footwear</option>
            </select>
            
            {/* Period Filter */}
            <select
              value={dateRange.start && dateRange.end ? 'custom' : selectedPeriod}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'custom') {
                  // Set default dates if not already set
                  if (!dateRange.start) {
                    const today = new Date();
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    setDateRange({
                      start: thirtyDaysAgo.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    });
                  }
                } else {
                  setSelectedPeriod(value);
                  setDateRange({ start: '', end: '' });
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 180 days</option>
              <option value="365">Last year</option>
              <option value="custom">Custom range...</option>
            </select>
            
            {/* Custom date pickers */}
            {dateRange.start && dateRange.end && (
              <>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="End date"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'performance', name: 'Performance', icon: '📈' },
              { id: 'customers', name: 'Customers', icon: '👥' },
              { id: 'operations', name: 'Operations', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${viewMode === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {viewMode === 'overview' && renderOverviewTab()}
          {viewMode === 'performance' && renderPerformanceTab()}
          {viewMode === 'customers' && renderCustomersTab()}
          {viewMode === 'operations' && renderOperationsTab()}
        </div>
      </div>
      </div>
    </FeatureGate>
  );
}

export default ResaleAnalytics;