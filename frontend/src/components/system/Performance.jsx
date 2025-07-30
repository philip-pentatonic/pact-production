import React, { useState, useEffect } from 'react';

import { getApiUrl } from '../../config';
function Performance() {
  const [metrics, setMetrics] = useState({
    api: [],
    database: [],
    cache: { hitRate: 0, misses: 0, hits: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/analytics/performance?range=${timeRange}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Extract metrics from the response wrapper
        setMetrics(data.metrics || data);
      } else if (response.status === 401) {
        console.error('Admin access required for performance metrics');
        // Set demo metrics for non-admin users
        setMetrics({
          api: [
            { path: '/api/data', method: 'GET', count: '***', avgDuration: '***', minDuration: '***', maxDuration: '***', errorRate: '***' },
            { path: '/api/upload', method: 'POST', count: '***', avgDuration: '***', minDuration: '***', maxDuration: '***', errorRate: '***' }
          ],
          database: { totalQueries: '***', avgQueryTime: '***', slowQueries: '***' },
          cache: { hitRate: 0, misses: '***', hits: '***' },
          unauthorized: true
        });
      }
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      // Set demo metrics for errors
      setMetrics({
        api: [
          { path: '/api/data', method: 'GET', count: 'Error', avgDuration: 'Error', minDuration: 'Error', maxDuration: 'Error', errorRate: 'Error' }
        ],
        database: { totalQueries: 'Error', avgQueryTime: 'Error', slowQueries: 'Error' },
        cache: { hitRate: 0, misses: 'Error', hits: 'Error' },
        error: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (avgTime) => {
    if (avgTime < 100) return 'text-green-600';
    if (avgTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Performance Monitoring
        </h1>
        
        {/* Time Range Selector */}
        <div className="flex flex-wrap gap-2">
          {['1h', '24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range === '1h' ? 'Last Hour' :
               range === '24h' ? 'Last 24 Hours' :
               range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="spinner mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Admin Access Notice */}
          {metrics.unauthorized && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-3">🔒</div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">Admin Access Required</h3>
                  <p className="text-yellow-800 mt-1">
                    Performance metrics are only available to administrators. 
                    Please contact your system administrator for access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {metrics.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">❌</div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Error Loading Metrics</h3>
                  <p className="text-red-800 mt-1">
                    There was an error loading performance metrics. Please try again later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API Performance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Endpoint</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-right py-2">Requests</th>
                    <th className="text-right py-2">Avg Time</th>
                    <th className="text-right py-2">Min Time</th>
                    <th className="text-right py-2">Max Time</th>
                    <th className="text-right py-2">Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.api.map((endpoint, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-mono text-sm">{endpoint.path}</td>
                      <td className="py-2">{endpoint.method}</td>
                      <td className="py-2 text-right">{endpoint.count}</td>
                      <td className={`py-2 text-right font-medium ${getStatusColor(endpoint.avgDuration)}`}>
                        {formatDuration(endpoint.avgDuration)}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {formatDuration(endpoint.minDuration)}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {formatDuration(endpoint.maxDuration)}
                      </td>
                      <td className="py-2 text-right">
                        <span className={endpoint.errorRate > 5 ? 'text-red-600' : 'text-gray-600'}>
                          {endpoint.errorRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Database Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Database Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded p-4">
                <div className="text-sm text-gray-600">Total Queries</div>
                <div className="text-2xl font-bold">{metrics.database.totalQueries || 0}</div>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <div className="text-sm text-gray-600">Avg Query Time</div>
                <div className="text-2xl font-bold">
                  {formatDuration(metrics.database.avgQueryTime || 0)}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <div className="text-sm text-gray-600">Slow Queries</div>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.database.slowQueries || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Cache Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cache Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded p-4">
                <div className="text-sm text-gray-600">Hit Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.cache.hitRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <div className="text-sm text-gray-600">Cache Hits</div>
                <div className="text-2xl font-bold">{metrics.cache.hits}</div>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <div className="text-sm text-gray-600">Cache Misses</div>
                <div className="text-2xl font-bold">{metrics.cache.misses}</div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            {metrics.system ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded p-4">
                  <div className="text-sm text-green-600">Uptime</div>
                  <div className="text-2xl font-bold text-green-900">{metrics.system.uptime}</div>
                  <div className="text-xs text-green-600">System availability</div>
                </div>
                <div className="bg-blue-50 rounded p-4">
                  <div className="text-sm text-blue-600">Response Time</div>
                  <div className="text-2xl font-bold text-blue-900">{metrics.system.responseTime}</div>
                  <div className="text-xs text-blue-600">Database performance</div>
                </div>
                <div className="bg-purple-50 rounded p-4">
                  <div className="text-sm text-purple-600">Throughput</div>
                  <div className="text-2xl font-bold text-purple-900">{metrics.system.throughput}</div>
                  <div className="text-xs text-purple-600">Data processing</div>
                </div>
                <div className="bg-orange-50 rounded p-4">
                  <div className="text-sm text-orange-600">Active Connections</div>
                  <div className="text-2xl font-bold text-orange-900">{metrics.system.activeConnections}</div>
                  <div className="text-xs text-orange-600">Current sessions</div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> System health monitoring requires admin access.
                </p>
              </div>
            )}
            
            {/* Additional System Info */}
            {metrics.database && !metrics.unauthorized && !metrics.error && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Database Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded p-4">
                    <div className="text-sm text-gray-600">Total Records</div>
                    <div className="text-2xl font-bold">{(metrics.database.totalRecords || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-600">In database</div>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <div className="text-sm text-gray-600">Recent Activity</div>
                    <div className="text-2xl font-bold">{(metrics.database.recentActivity || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Current period</div>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <div className="text-sm text-gray-600">Active Members</div>
                    <div className="text-2xl font-bold">{metrics.database.activeMembers || 0}</div>
                    <div className="text-xs text-gray-600">Current period</div>
                  </div>
                </div>
              </div>
            )}

            {/* Meta Information */}
            {metrics.meta && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Metrics Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Time Range:</span>
                    <span className="text-blue-700 ml-2">{metrics.meta.timeRange}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Data Freshness:</span>
                    <span className="text-blue-700 ml-2">{metrics.meta.dataFreshness}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Last Updated:</span>
                    <span className="text-blue-700 ml-2">{new Date(metrics.meta.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Performance Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Performance Optimization Tips
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enable caching for frequently accessed data</li>
              <li>• Use database indexes on commonly queried fields</li>
              <li>• Implement pagination for large data sets</li>
              <li>• Consider CDN for static assets</li>
              <li>• Monitor and optimize slow queries</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Performance; 