import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../config';
import TradeInDetailModal from '../modals/TradeInDetailModal';

function TradeIns() {
  const [tradeIns, setTradeIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTradeInId, setSelectedTradeInId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusColors = {
    submitted: 'bg-yellow-100 text-yellow-800',
    evaluating: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    paid_out: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  useEffect(() => {
    fetchTradeIns();
  }, []);

  const fetchTradeIns = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/admin/resale/trade-ins'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Code': localStorage.getItem('activeTenant') || ''
        }
      });

      if (!response.ok) throw new Error('Failed to fetch trade-ins');
      const data = await response.json();
      setTradeIns(data.tradeIns || data.trade_ins || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTradeInStatus = async (tradeInId, newStatus) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/resale/trade-ins/${tradeInId}/status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'X-Tenant-Code': localStorage.getItem('activeTenant') || ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      await fetchTradeIns();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredTradeIns = tradeIns.filter(tradeIn => {
    const matchesStatus = selectedStatus === 'all' || tradeIn.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      tradeIn.submission_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tradeIn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tradeIn.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return <div className="p-4">Loading trade-ins...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Trade-In Submissions</h2>
          <p className="text-sm text-gray-600 mt-1">Manage customer trade-in requests</p>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by code, name, or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="evaluating">Evaluating</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="paid_out">Paid Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{tradeIns.length}</div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">
                {tradeIns.filter(t => t.status === 'submitted').length}
              </div>
              <div className="text-sm text-yellow-700">Pending Review</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {tradeIns.filter(t => t.status === 'accepted').length}
              </div>
              <div className="text-sm text-green-700">Accepted</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                ${tradeIns.reduce((sum, t) => sum + (t.payout_amount || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-purple-700">Total Payouts</div>
            </div>
          </div>

          {/* Trade-ins Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTradeIns.map((tradeIn) => (
                  <tr key={tradeIn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tradeIn.submission_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div>{tradeIn.customer_name}</div>
                      <div className="text-xs text-gray-400">{tradeIn.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {tradeIn.item_count || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${(tradeIn.total_estimated_value || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[tradeIn.status]}`}>
                        {tradeIn.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tradeIn.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTradeInId(tradeIn.id);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      {tradeIn.status === 'submitted' && (
                        <select
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                          onChange={(e) => updateTradeInStatus(tradeIn.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Update Status</option>
                          <option value="evaluating">Start Evaluation</option>
                          <option value="accepted">Accept</option>
                          <option value="rejected">Reject</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade-In Detail Modal */}
      {selectedTradeInId && (
        <TradeInDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTradeInId(null);
          }}
          tradeInId={selectedTradeInId}
        />
      )}
    </div>
  );
}

export default TradeIns;