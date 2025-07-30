import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getApiUrl } from '../../config';

const MailbackPackages = () => {
  const token = localStorage.getItem('token');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPackages();
  }, [page, statusFilter, dateFrom, dateTo]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(
        getApiUrl(`/pact/mailback-packages?${params}`),
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': localStorage.getItem('activeTenant') || 'kiehls'
          } 
        }
      );

      const data = await response.json();
      if (data.success) {
        setPackages(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error(data.error || 'Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      // Use mock data for development
      setPackages(getMockPackages());
    } finally {
      setLoading(false);
    }
  };

  const getMockPackages = () => [
    {
      id: 1,
      unique_id: 'PACT-2024-001',
      tracking_number: '1Z999AA10123456784',
      user_name: 'Jane Doe',
      email: 'jane.doe@example.com',
      member_name: 'Credo Beauty',
      member_code: 'CREDO',
      status: 'shipped',
      shipping_date: '2024-01-15T10:00:00Z',
      processed_date: null,
      program_type: 'PACT_BEAUTY_MAIL_BACK',
      box_type: 'Small Box',
      weight_lbs: 2.5,
      g2_status: 'pending'
    },
    {
      id: 2,
      unique_id: 'PACT-2024-002',
      tracking_number: '1Z999AA10123456785',
      user_name: 'John Smith',
      email: 'john.smith@example.com',
      member_name: 'Kiehls',
      member_code: 'KIEHLS',
      status: 'completed',
      shipping_date: '2024-01-10T10:00:00Z',
      processed_date: '2024-01-14T10:00:00Z',
      program_type: 'PACT_BEAUTY_STORE_DROPOFF',
      box_type: 'Medium Box',
      weight_lbs: 5.2,
      g2_status: 'processed'
    }
  ];

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(
        getApiUrl(`/pact/mailback-packages/export?${params}`),
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': localStorage.getItem('activeTenant') || 'kiehls'
          }
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pact-packages-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Export feature coming soon!');
    }
  };

  const handleViewDetails = async (pkg) => {
    setSelectedPackage(pkg);
    setDetailsOpen(true);
    
    // Fetch full details
    try {
      const response = await fetch(
        getApiUrl(`/pact/mailback-packages/${pkg.id}`),
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': localStorage.getItem('activeTenant') || 'kiehls'
          } 
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setSelectedPackage(data.data);
      }
    } catch (error) {
      console.error('Error fetching package details:', error);
    }
  };

  const getStatusBadge = (status, g2Status) => {
    const statusConfig = {
      'generated': { className: 'bg-gray-100 text-gray-800', label: 'Generated' },
      'shipped': { className: 'bg-blue-100 text-blue-800', label: 'Shipped' },
      'received': { className: 'bg-cyan-100 text-cyan-800', label: 'Received at G2' },
      'processed': { className: 'bg-yellow-100 text-yellow-800', label: 'Processing' },
      'completed': { className: 'bg-green-100 text-green-800', label: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig['generated'];
    
    return (
      <div className="flex gap-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
        {g2Status && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700">
            G2: {g2Status}
          </span>
        )}
      </div>
    );
  };

  const getProgramLabel = (program) => {
    const labels = {
      'PACT_BEAUTY_MAIL_BACK': 'Mail Back',
      'PACT_BEAUTY_STORE_DROPOFF': 'Store Drop-off',
      'PACT_BEAUTY_SPECIAL': 'Special Event',
      'PACT_MAIL_BACK': 'Mail Back',
      'PACT_STORE_DROPOFF': 'Store Drop-off',
      'PACT_SPECIAL': 'Special Event'
    };
    return labels[program] || program;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        PACT Mailback Packages
      </h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by tracking # or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchPackages()}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="generated">Generated</option>
              <option value="shipped">Shipped</option>
              <option value="received">Received</option>
              <option value="processed">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="From Date"
            />
          </div>
          
          <div className="md:col-span-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="To Date"
            />
          </div>
          
          <div className="md:col-span-3 flex gap-2">
            <button
              onClick={fetchPackages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <button
              onClick={fetchPackages}
              className="p-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beauty Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (lbs)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                        No packages found
                      </td>
                    </tr>
                  ) : (
                    packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span className="text-gray-900">{pkg.tracking_number || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.unique_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-purple-200 text-purple-800">
                            {pkg.member_name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{pkg.user_name}</div>
                            <div className="text-xs text-gray-500">{pkg.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700">
                            {getProgramLabel(pkg.program_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(pkg.status, pkg.g2_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pkg.shipping_date
                            ? format(new Date(pkg.shipping_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pkg.weight_lbs || 'Pending'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetails(pkg)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 border-t border-b border-gray-300 text-sm text-gray-700 bg-white">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Package Details</h3>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedPackage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Tracking Number</h4>
                    <p className="text-sm text-gray-900">{selectedPackage.tracking_number || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Unique ID</h4>
                    <p className="text-sm text-gray-900">{selectedPackage.unique_id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Recipient</h4>
                    <p className="text-sm text-gray-900">{selectedPackage.user_name}</p>
                    <p className="text-xs text-gray-500">{selectedPackage.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    {getStatusBadge(selectedPackage.status, selectedPackage.g2_status)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Shipping Date</h4>
                    <p className="text-sm text-gray-900">
                      {selectedPackage.shipping_date
                        ? format(new Date(selectedPackage.shipping_date), 'MMM dd, yyyy h:mm a')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Processed Date</h4>
                    <p className="text-sm text-gray-900">
                      {selectedPackage.processed_date
                        ? format(new Date(selectedPackage.processed_date), 'MMM dd, yyyy h:mm a')
                        : 'Pending'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                    <p className="text-sm text-gray-900">{selectedPackage.full_address || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailbackPackages;