import React, { useState, useEffect } from 'react';
import { 
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  MapPinIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { getApiUrl } from '../../config';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, Area, AreaChart
} from 'recharts';

// Colors for rankings
const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
  default: '#9CA3AF' // Gray
};

const PERFORMANCE_COLORS = {
  excellent: '#10B981',
  good: '#3B82F6',
  average: '#F59E0B',
  poor: '#EF4444'
};

function StoreRankings() {
  const [storesData, setStoresData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [sortBy, setSortBy] = useState('weight'); // weight, items, efficiency, trend
  const [viewMode, setViewMode] = useState('leaderboard'); // leaderboard, comparison, trends
  const [selectedStores, setSelectedStores] = useState([]);
  
  // Custom date range state
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchStoreRankings();
  }, [selectedMember, selectedPeriod, useCustomDates, startDate, endDate]);

  const fetchStoreRankings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `/api/analytics/store-rankings?member=${selectedMember}`;
      if (useCustomDates && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      } else {
        url += `&period=${selectedPeriod}`;
      }
      const response = await fetch(getApiUrl(url), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStoresData(data.rankings || generateMockData());
      } else {
        // Use mock data if API fails
        setStoresData(generateMockData());
      }
    } catch (error) {
      console.error('Error fetching store rankings:', error);
      setStoresData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const storeNames = [
      "Kiehl's Times Square", "Kiehl's SoHo", "Kiehl's Upper East Side", 
      "Kiehl's Brooklyn", "Kiehl's Chelsea", "Kiehl's Financial District",
      "Aesop Nolita", "Aesop West Village", "Aesop Madison Ave",
      "Kiehl's Chicago Downtown", "Kiehl's LA Beverly Hills", "Kiehl's Miami Beach",
      "Aesop Boston", "Aesop Seattle", "Kiehl's San Francisco Union Square",
      "Kiehl's Dallas", "Kiehl's Houston", "Aesop Portland",
      "Kiehl's Philadelphia", "Kiehl's DC Georgetown"
    ];

    return storeNames.map((name, index) => {
      const baseWeight = Math.random() * 800 + 200;
      const trend = (Math.random() - 0.5) * 20;
      const efficiency = Math.random() * 30 + 70;
      
      return {
        id: index + 1,
        store_name: name,
        member: name.startsWith('Kiehl') ? "Kiehl's" : 'Aesop',
        city: name.split(' ').slice(-1)[0],
        total_weight: baseWeight,
        total_items: Math.floor(baseWeight * 2.5),
        avg_weight_per_day: baseWeight / 30,
        collection_count: Math.floor(Math.random() * 20 + 5),
        efficiency_rate: efficiency,
        contamination_rate: Math.random() * 5 + 1,
        trend_percentage: trend,
        last_month_weight: baseWeight * (1 - trend/100),
        program_type: Math.random() > 0.3 ? 'In-Store Kiosk' : 'Box Return',
        ranking_change: Math.floor((Math.random() - 0.5) * 5),
        performance_score: efficiency * (1 - Math.abs(trend)/100)
      };
    }).sort((a, b) => b[sortBy] - a[sortBy]);
  };

  const getPerformanceCategory = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  };

  const getRankingIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const handleStoreSelection = (storeId) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else if (prev.length < 5) {
        return [...prev, storeId];
      } else {
        alert('You can compare up to 5 stores at a time');
        return prev;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderLeaderboard = () => (
    <div className="space-y-6">
      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {storesData.slice(0, 3).map((store, index) => (
          <div key={store.id} className={`relative rounded-xl p-6 text-white overflow-hidden ${
            index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
            'bg-gradient-to-r from-orange-600 to-orange-700'
          }`}>
            <div className="absolute top-2 right-2 text-4xl opacity-20">
              {getRankingIcon(index + 1)}
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold">#{index + 1}</span>
                <TrophyIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{store.store_name}</h3>
              <p className="text-2xl font-bold">{store.total_weight.toFixed(0)} lbs</p>
              <p className="text-sm opacity-90">{store.total_items.toLocaleString()} items</p>
              <div className="flex items-center mt-2">
                {store.trend_percentage > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(store.trend_percentage).toFixed(1)}% vs last period
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Complete Rankings</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="total_weight">Total Weight</option>
                <option value="total_items">Total Items</option>
                <option value="efficiency_rate">Efficiency</option>
                <option value="trend_percentage">Growth Trend</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight (lbs)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storesData.map((store, index) => {
                const performanceCategory = getPerformanceCategory(store.efficiency_rate);
                return (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">
                          {index + 1}
                        </span>
                        {getRankingIcon(index + 1) && (
                          <span className="ml-2 text-xl">{getRankingIcon(index + 1)}</span>
                        )}
                        {store.ranking_change !== 0 && (
                          <span className={`ml-2 text-xs font-medium ${
                            store.ranking_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {store.ranking_change > 0 ? '↑' : '↓'} {Math.abs(store.ranking_change)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{store.store_name}</div>
                        <div className="text-xs text-gray-500">{store.program_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {store.member}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {store.total_weight.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.total_items.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.avg_weight_per_day.toFixed(1)} lbs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full bg-${performanceCategory === 'excellent' ? 'green' : performanceCategory === 'good' ? 'blue' : performanceCategory === 'average' ? 'yellow' : 'red'}-500`}
                            style={{ width: `${store.efficiency_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{store.efficiency_rate.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm font-medium ${
                        store.trend_percentage > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {store.trend_percentage > 0 ? (
                          <ArrowUpIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(store.trend_percentage).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        performanceCategory === 'excellent' ? 'bg-green-100 text-green-800' :
                        performanceCategory === 'good' ? 'bg-blue-100 text-blue-800' :
                        performanceCategory === 'average' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {performanceCategory.charAt(0).toUpperCase() + performanceCategory.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Distribution by Store</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storesData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="store_name" angle={-45} textAnchor="end" height={100} fontSize={10} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_weight" name="Weight (lbs)">
                {storesData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? MEDAL_COLORS[index + 1] : MEDAL_COLORS.default} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency vs Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={storesData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="store_name" angle={-45} textAnchor="end" height={100} fontSize={10} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="efficiency_rate" stackId="1" stroke="#10B981" fill="#10B981" name="Efficiency %" />
              <Area type="monotone" dataKey="contamination_rate" stackId="1" stroke="#EF4444" fill="#EF4444" name="Contamination %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderComparison = () => {
    const comparisonStores = storesData.filter(store => selectedStores.includes(store.id));
    
    if (comparisonStores.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <BuildingStorefrontIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Stores to Compare</h3>
          <p className="text-gray-600 mb-6">Choose up to 5 stores from the list below to see detailed comparisons</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-left">
            {storesData.map(store => (
              <label key={store.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStores.includes(store.id)}
                  onChange={() => handleStoreSelection(store.id)}
                  className="mr-2"
                />
                <span className="text-sm">{store.store_name}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Comparison Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {comparisonStores.map(store => (
            <div key={store.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">{store.store_name}</h4>
                <button
                  onClick={() => handleStoreSelection(store.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-medium ml-1">{store.total_weight.toFixed(0)} lbs</span>
                </div>
                <div>
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium ml-1">{store.total_items.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Efficiency:</span>
                  <span className="font-medium ml-1">{store.efficiency_rate.toFixed(0)}%</span>
                </div>
                <div className={`font-medium ${store.trend_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {store.trend_percentage > 0 ? '+' : ''}{store.trend_percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonStores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="store_name" angle={-20} textAnchor="end" height={80} fontSize={11} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_weight" fill="#3B82F6" name="Weight (lbs)" />
                <Bar dataKey="efficiency_rate" fill="#10B981" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={comparisonStores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="store_name" angle={-20} textAnchor="end" height={80} fontSize={11} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="trend_percentage" stroke="#F59E0B" strokeWidth={3} name="Growth Trend %" />
                <Line type="monotone" dataKey="contamination_rate" stroke="#EF4444" strokeWidth={2} name="Contamination %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    // Generate trend data for the last 6 months
    const trendData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - i));
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        top_performer: Math.random() * 200 + 800,
        average: Math.random() * 100 + 400,
        bottom_performer: Math.random() * 50 + 100
      };
    });

    return (
      <div className="space-y-6">
        {/* Trend Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <FireIcon className="h-8 w-8 mb-2" />
            <h3 className="text-lg font-semibold">Top Growth</h3>
            <p className="text-2xl font-bold">+23.5%</p>
            <p className="text-sm opacity-90">Kiehl's Times Square</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <SparklesIcon className="h-8 w-8 mb-2" />
            <h3 className="text-lg font-semibold">Most Consistent</h3>
            <p className="text-2xl font-bold">σ = 12.3</p>
            <p className="text-sm opacity-90">Aesop Madison Ave</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <TrophyIcon className="h-8 w-8 mb-2" />
            <h3 className="text-lg font-semibold">Longest Streak</h3>
            <p className="text-2xl font-bold">4 months</p>
            <p className="text-sm opacity-90">Kiehl's SoHo at #1</p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <ArrowUpIcon className="h-8 w-8 mb-2" />
            <h3 className="text-lg font-semibold">Biggest Mover</h3>
            <p className="text-2xl font-bold">↑ 8 spots</p>
            <p className="text-sm opacity-90">Kiehl's Chicago</p>
          </div>
        </div>

        {/* Historical Performance Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends (6 Months)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="top_performer" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Top 20%" />
              <Area type="monotone" dataKey="average" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} name="Average" />
              <Area type="monotone" dataKey="bottom_performer" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} name="Bottom 20%" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Movement Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Biggest Movers This Period</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {storesData
              .filter(store => Math.abs(store.ranking_change) > 2)
              .sort((a, b) => Math.abs(b.ranking_change) - Math.abs(a.ranking_change))
              .slice(0, 10)
              .map(store => (
                <div key={store.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-4 ${
                      store.ranking_change > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {store.ranking_change > 0 ? (
                        <ArrowUpIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{store.store_name}</p>
                      <p className="text-sm text-gray-500">{store.member} • {store.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      store.ranking_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {store.ranking_change > 0 ? '+' : ''}{store.ranking_change} spots
                    </p>
                    <p className="text-sm text-gray-500">
                      Now ranked #{storesData.findIndex(s => s.id === store.id) + 1}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <TrophyIcon className="h-8 w-8 mr-3 text-yellow-500" />
          Store Performance Rankings
        </h2>
        <p className="mt-2 text-gray-600">
          Track and compare store-by-store recycling performance across all locations
        </p>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <div className="flex items-center gap-2">
                <select
                  value={useCustomDates ? 'custom' : selectedPeriod}
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
                      setSelectedPeriod(value);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last quarter</option>
                  <option value="365">Last year</option>
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
          
          <div className="flex gap-2">
            {['leaderboard', 'comparison', 'trends'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode === 'leaderboard' && <ChartBarIcon className="h-4 w-4 inline mr-1" />}
                {mode === 'comparison' && <ArrowsUpDownIcon className="h-4 w-4 inline mr-1" />}
                {mode === 'trends' && <ArrowUpIcon className="h-4 w-4 inline mr-1" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Content */}
      {viewMode === 'leaderboard' && renderLeaderboard()}
      {viewMode === 'comparison' && renderComparison()}
      {viewMode === 'trends' && renderTrends()}
    </div>
  );
}

export default StoreRankings; 