import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { getApiUrl } from '../../config';

function TradeInDetailModal({ tradeInId, isOpen, onClose }) {
  const [tradeIn, setTradeIn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && tradeInId) {
      fetchTradeInDetail();
    }
  }, [isOpen, tradeInId]);

  const fetchTradeInDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const tenantCode = localStorage.getItem('activeTenant') || 'pact';
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Code': tenantCode
      };
      
      console.log('Fetching trade-in detail:', tradeInId, 'with tenant:', tenantCode);
      
      const response = await fetch(getApiUrl(`/admin/resale/trade-ins/${tradeInId}`), {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Trade-in detail response:', data);
        setTradeIn(data.tradeIn || data.trade_in || data);
      } else {
        const errorText = await response.text();
        console.error('Trade-in detail error:', response.status, errorText);
        setError('Failed to load trade-in details');
      }
    } catch (error) {
      console.error('Error fetching trade-in details:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-yellow-100 text-yellow-800',
      evaluating: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid_out: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return `px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getConditionBadge = (condition) => {
    const styles = {
      like_new: 'bg-green-100 text-green-800',
      excellent: 'bg-blue-100 text-blue-800',
      good: 'bg-yellow-100 text-yellow-800',
      fair: 'bg-orange-100 text-orange-800',
      poor: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${styles[condition] || 'bg-gray-100 text-gray-800'}`;
  };

  const getDispositionBadge = (disposition) => {
    const styles = {
      resale: 'bg-green-100 text-green-800',
      repair: 'bg-blue-100 text-blue-800',
      recycle: 'bg-yellow-100 text-yellow-800',
      return: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${styles[disposition] || 'bg-gray-100 text-gray-800'}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trade-In Details</h2>
            {tradeIn && (
              <p className="text-gray-600">
                {tradeIn.submission_code} - {tradeIn.submitted_at ? formatDate(tradeIn.submitted_at) : 'Unknown date'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-600">Loading trade-in details...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {tradeIn && (
            <div className="space-y-6">
              {/* Trade-In Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600">Customer</p>
                      <p className="font-semibold text-blue-900">
                        {tradeIn.customer_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-blue-700">{tradeIn.customer_email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600">Value</p>
                      <p className="font-semibold text-green-900">
                        ${(tradeIn.total_actual_value || tradeIn.total_estimated_value || 0).toFixed(2)}
                      </p>
                      {tradeIn.total_actual_value && tradeIn.total_estimated_value && (
                        <p className="text-xs text-green-700">
                          Est: ${tradeIn.total_estimated_value.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CubeIcon className="h-6 w-6 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600">Items</p>
                      <p className="font-semibold text-purple-900">{tradeIn.item_count || 0}</p>
                      {tradeIn.items_accepted !== undefined && (
                        <p className="text-xs text-purple-700">
                          {tradeIn.items_accepted} accepted, {tradeIn.items_rejected || 0} rejected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-gray-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={getStatusBadge(tradeIn.status || 'submitted')}>
                        {(tradeIn.status || 'submitted').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2" />
                  Trade-In Items ({tradeIn.items?.length || 0})
                </h3>
                
                {tradeIn.items && tradeIn.items.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Condition
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Est. Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actual Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Disposition
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tradeIn.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-xs text-gray-500">
                                {item.product_type} • {item.brand}
                                {item.size && ` • ${item.size}`}
                                {item.color && ` • ${item.color}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={getConditionBadge(item.condition)}>
                                {(item.condition || 'unknown').replace('_', ' ')}
                              </span>
                              {item.warehouse_condition && item.warehouse_condition !== item.condition && (
                                <div className="mt-1">
                                  <span className="text-xs text-gray-500">Warehouse: </span>
                                  <span className={getConditionBadge(item.warehouse_condition)}>
                                    {item.warehouse_condition.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              ${(item.estimated_value || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              ${(item.actual_value || item.final_value || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={getDispositionBadge(item.warehouse_disposition || 'pending')}>
                                {(item.warehouse_disposition || 'pending')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {item.warehouse_notes || item.condition_notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">No items recorded</p>
                )}
              </div>

              {/* Payout Information */}
              {tradeIn.payout_method && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Information</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-green-600">Method</p>
                        <p className="font-semibold text-green-900">
                          {tradeIn.payout_method.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600">Amount</p>
                        <p className="font-semibold text-green-900">
                          ${(tradeIn.payout_amount || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600">Paid Out</p>
                        <p className="font-semibold text-green-900">
                          {tradeIn.paid_out_at ? formatDate(tradeIn.paid_out_at) : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Information */}
              {(tradeIn.shipping_label_url || tradeIn.tracking_number) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TruckIcon className="h-5 w-5 mr-2" />
                    Shipping Information
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tradeIn.tracking_number && (
                        <div>
                          <p className="text-sm text-blue-600">Tracking Number</p>
                          <p className="font-semibold text-blue-900">
                            {tradeIn.tracking_number}
                          </p>
                        </div>
                      )}
                      {tradeIn.shipping_label_url && (
                        <div>
                          <p className="text-sm text-blue-600">Shipping Label</p>
                          <a 
                            href={tradeIn.shipping_label_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900 underline"
                          >
                            Download Label
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(tradeIn.evaluator_notes || tradeIn.rejection_reason) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  {tradeIn.evaluator_notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Evaluator Notes</p>
                      <p className="text-gray-700">{tradeIn.evaluator_notes}</p>
                    </div>
                  )}
                  {tradeIn.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason</p>
                      <p className="text-red-700">{tradeIn.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TradeInDetailModal;