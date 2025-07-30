import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../config';

const ValuationRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [productTypes, setProductTypes] = useState([]);

  const conditions = ['like_new', 'excellent', 'good', 'fair', 'poor'];

  const [formData, setFormData] = useState({
    product_type: '',
    condition: '',
    min_original_price: '',
    max_original_price: '',
    value_percentage: '',
    flat_value: '',
    priority: 0,
    is_active: true
  });

  useEffect(() => {
    fetchRules();
    fetchProductTypes();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/admin/resale/valuation-rules'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch valuation rules');
      
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/resale/product-types'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProductTypes(data.types || ['Jacket', 'Pants', 'Shirt', 'Overall', 'Vest', 'Hat', 'Gloves', 'Other']);
      }
    } catch (err) {
      console.error('Error fetching product types:', err);
      setProductTypes(['Jacket', 'Pants', 'Shirt', 'Overall', 'Vest', 'Hat', 'Gloves', 'Other']);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingRule 
        ? getApiUrl(`/admin/resale/valuation-rules/${editingRule.id}`)
        : getApiUrl('/admin/resale/valuation-rules');
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          min_original_price: formData.min_original_price ? parseFloat(formData.min_original_price) : null,
          max_original_price: formData.max_original_price ? parseFloat(formData.max_original_price) : null,
          value_percentage: formData.value_percentage ? parseFloat(formData.value_percentage) : null,
          flat_value: formData.flat_value ? parseFloat(formData.flat_value) : null,
          priority: parseInt(formData.priority)
        })
      });

      if (!response.ok) throw new Error('Failed to save valuation rule');
      
      fetchRules();
      resetForm();
    } catch (err) {
      alert(`Error saving rule: ${err.message}`);
    }
  };

  const deleteRule = async (id) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const response = await fetch(getApiUrl(`/admin/resale/valuation-rules/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete rule');
      
      fetchRules();
    } catch (err) {
      alert(`Error deleting rule: ${err.message}`);
    }
  };

  const toggleRuleStatus = async (rule) => {
    try {
      const response = await fetch(getApiUrl(`/admin/resale/valuation-rules/${rule.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...rule, is_active: !rule.is_active })
      });

      if (!response.ok) throw new Error('Failed to update rule status');
      
      fetchRules();
    } catch (err) {
      alert(`Error updating rule: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      product_type: '',
      condition: '',
      min_original_price: '',
      max_original_price: '',
      value_percentage: '',
      flat_value: '',
      priority: 0,
      is_active: true
    });
    setEditingRule(null);
    setShowAddRule(false);
  };

  const editRule = (rule) => {
    setFormData({
      product_type: rule.product_type,
      condition: rule.condition,
      min_original_price: rule.min_original_price || '',
      max_original_price: rule.max_original_price || '',
      value_percentage: rule.value_percentage || '',
      flat_value: rule.flat_value || '',
      priority: rule.priority,
      is_active: rule.is_active
    });
    setEditingRule(rule);
    setShowAddRule(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading valuation rules...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Valuation Rules</h1>
        <p className="mt-2 text-gray-600">Configure automatic valuation rules for trade-in items</p>
      </div>

      {/* Add Rule Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddRule(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Rule
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No valuation rules configured yet. Add your first rule to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valuation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className={!rule.is_active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.product_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="capitalize">{rule.condition.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.min_original_price || rule.max_original_price ? (
                        <span>
                          ${rule.min_original_price || '0'} - ${rule.max_original_price || '∞'}
                        </span>
                      ) : (
                        <span className="text-gray-400">Any price</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.value_percentage ? (
                        <span>{rule.value_percentage}% of original</span>
                      ) : rule.flat_value ? (
                        <span>${rule.flat_value} flat</span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRuleStatus(rule)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => editRule(rule)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {editingRule ? 'Edit Valuation Rule' : 'Add New Valuation Rule'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type
                  </label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select type...</option>
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select condition...</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Original Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_original_price}
                    onChange={(e) => setFormData({ ...formData, min_original_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Original Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_original_price}
                    onChange={(e) => setFormData({ ...formData, max_original_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Choose either a percentage of original price OR a flat value:
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.value_percentage}
                      onChange={(e) => setFormData({ ...formData, value_percentage: e.target.value, flat_value: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 30"
                      disabled={formData.flat_value !== ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OR Flat Value ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.flat_value}
                      onChange={(e) => setFormData({ ...formData, flat_value: e.target.value, value_percentage: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 25.00"
                      disabled={formData.value_percentage !== ''}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher priority rules are applied first</p>
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Rule is active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValuationRules;