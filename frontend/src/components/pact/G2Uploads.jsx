import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../config';

const G2Uploads = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    processing: 0
  });
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUploads();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUploads, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchUploads = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await fetch(getApiUrl(`/pact/g2/upload-history?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch uploads');
      
      const data = await response.json();
      setUploads(data.data || []);
      
      // Calculate stats
      const stats = data.data.reduce((acc, upload) => {
        acc.total++;
        if (upload.status === 'completed_with_errors') {
          acc.completed_with_errors = (acc.completed_with_errors || 0) + 1;
        } else {
          acc[upload.status] = (acc[upload.status] || 0) + 1;
        }
        return acc;
      }, { total: 0, completed: 0, failed: 0, pending: 0, processing: 0, error: 0, completed_with_errors: 0 });
      
      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUploads();
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500 text-lg">✓</span>;
      case 'error':
      case 'failed':
        return <span className="text-red-500 text-lg">✗</span>;
      case 'processing':
        return <span className="text-blue-500 text-lg animate-pulse">⟳</span>;
      case 'pending':
        return <span className="text-gray-400 text-lg">⏰</span>;
      default:
        return <span className="text-yellow-500 text-lg">⚠</span>;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
      completed_with_errors: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getFileTypeLabel = (fileName) => {
    if (!fileName) return 'Unknown';
    const fileMap = {
      'nightlypactcollectiveretailshipping': 'Retail Shipping',
      'nightlypactcollectiveretailprocessing': 'Retail Processing',
      'nightlypactcollectiveconsumersupportedmailback': 'Consumer Mailback',
      'nightlypactcollectivebrandsupportedmailback': 'Brand Mailback',
      'nightlypactcollectivemanehottools': 'Mane Hot Tools',
      'nightlypactcollectiveiliaprocessing': 'ILIA Processing',
      'nightlypactcollectivertcprocessing': 'RTC Processing',
      'nightlypactcollectivebulkprocessing': 'Bulk Processing'
    };
    
    const key = fileName.toLowerCase().replace('.csv', '');
    return fileMap[key] || fileName;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-500">Loading G2 uploads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">G2 Upload Monitor</h1>
          <p className="mt-1 text-sm text-gray-500">Track and verify G2 file uploads and processing status</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <span className={`mr-2 ${refreshing ? 'animate-spin inline-block' : ''}`}>↻</span>
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-gray-400">📥</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Uploads</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-green-500">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completed || 0}</dd>
                  {stats.completed_with_errors > 0 && (
                    <dd className="text-xs text-orange-600">+{stats.completed_with_errors} with errors</dd>
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
                <span className="text-2xl text-blue-500">⟳</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processing</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.processing || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-gray-400">⏰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl text-red-500">❌</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                  <dd className="text-lg font-medium text-gray-900">{(stats.error || 0) + (stats.failed || 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          {['all', 'completed', 'completed_with_errors', 'processing', 'pending', 'error'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                filter === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status === 'completed_with_errors' ? 'With Errors' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && stats[status] > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {stats[status]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Uploads Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Upload Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Records
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Processing Time
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {uploads.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No uploads found
                </td>
              </tr>
            ) : (
              uploads.map((upload) => (
                <tr key={upload.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(upload.status)}
                      <div className="ml-2">
                        {getStatusBadge(upload.status)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getFileTypeLabel(upload.file_name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {upload.file_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(upload.upload_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {upload.records_processed || 0} / {upload.records_count || 0}
                    </div>
                    {upload.errors_count > 0 && (
                      <div className="text-sm text-red-600">
                        {upload.errors_count} errors
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.started_at && upload.completed_at ? (
                      <div>
                        {Math.round((new Date(upload.completed_at) - new Date(upload.started_at)) / 1000)}s
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedUpload(upload)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <span className="text-lg">ℹ️</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedUpload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Details</h3>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">File Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedUpload.file_name}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">{getStatusBadge(selectedUpload.status)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedUpload.upload_date)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Processing Started</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedUpload.started_at)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Processing Completed</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedUpload.completed_at)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Records</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedUpload.records_processed || 0} processed / {selectedUpload.records_count || 0} total
                  </dd>
                </div>
                
                {selectedUpload.errors_count > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Errors</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedUpload.errors_count} errors occurred
                    </dd>
                  </div>
                )}
                
                {selectedUpload.error_details && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Error Details</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {typeof selectedUpload.error_details === 'string' 
                          ? selectedUpload.error_details 
                          : JSON.stringify(selectedUpload.error_details, null, 2)}
                      </pre>
                    </dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-6">
                <button
                  onClick={() => setSelectedUpload(null)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default G2Uploads;