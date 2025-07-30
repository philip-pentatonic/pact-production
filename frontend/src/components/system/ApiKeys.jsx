import React, { useState, useEffect } from 'react';

import { getApiUrl } from '../../config';
function ApiKeys() {
  // Check if in demo mode
  if (import.meta.env.VITE_DEMO_MODE) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">API Keys Disabled in Demo</h3>
          <p className="text-gray-600 mb-4">
            API key generation is disabled in the demo environment for security reasons.
          </p>
          <p className="text-sm text-gray-500">
            Contact <a href="mailto:sales@pentatonic.com" className="text-blue-600 hover:text-blue-500">sales@pentatonic.com</a> for full access.
          </p>
        </div>
      </div>
    );
  }
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState(['read']);
  const [selectedKeyUsage, setSelectedKeyUsage] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/keys'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.api_keys);
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/keys'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: selectedPermissions
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setShowApiKey(data.api_key);
        fetchApiKeys(); // Refresh list
        showNotification('API key created successfully!', 'success');
      } else {
        showNotification('Failed to create API key', 'error');
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      showNotification('Error creating API key', 'error');
    }
  };

  const revokeApiKey = async (apiKeyId) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/keys'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key_id: apiKeyId })
      });
      
      if (response.ok) {
        fetchApiKeys(); // Refresh list
        showNotification('API key revoked successfully', 'success');
      } else {
        showNotification('Failed to revoke API key', 'error');
      }
    } catch (err) {
      console.error('Error revoking API key:', err);
      showNotification('Error revoking API key', 'error');
    }
  };

  const fetchApiUsage = async (apiKeyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/keys/usage?api_key_id=${apiKeyId}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSelectedKeyUsage(data.usage_stats);
      }
    } catch (err) {
      console.error('Error fetching API usage:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600 text-white' :
          notification.type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New API Key
        </button>
      </div>

      {/* API Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">API Documentation</h2>
        <p className="text-sm text-blue-800 mb-4">
          Use the Partner API to programmatically access your recycling data.
        </p>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Base URL:</span>{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">
              https://recycling-platform-backend.philip-mossop.workers.dev/api/v1
            </code>
          </div>
          <div>
            <span className="font-medium">Authentication:</span>{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">
              X-API-Key: your_api_key
            </code>
          </div>
                      <div className="mt-4">
              <h4 className="font-medium text-blue-900 mb-2">Common Endpoints:</h4>
              <div className="text-sm space-y-1">
                <div><code className="bg-blue-100 px-2 py-1 rounded">GET /api/v1/dashboard</code> - Get dashboard data</div>
                <div><code className="bg-blue-100 px-2 py-1 rounded">GET /api/v1/materials</code> - List material types</div>
                <div><code className="bg-blue-100 px-2 py-1 rounded">POST /api/v1/recycling</code> - Submit recycling data</div>
                <div><code className="bg-blue-100 px-2 py-1 rounded">GET /api/v1/analytics/*</code> - Analytics endpoints</div>
              </div>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Your API Keys</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rate Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 text-sm font-medium">{key.name}</td>
                    <td className="px-6 py-4 text-sm">
                      {JSON.parse(key.permissions || '[]').join(', ')}
                    </td>
                    <td className="px-6 py-4 text-sm">{key.rate_limit}/hour</td>
                    <td className="px-6 py-4 text-sm">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {key.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchApiUsage(key.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Usage
                        </button>
                        {key.is_active && (
                          <button
                            onClick={() => revokeApiKey(key.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New API Key</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Production Key"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes('read')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPermissions([...selectedPermissions, 'read']);
                      } else {
                        setSelectedPermissions(selectedPermissions.filter(p => p !== 'read'));
                      }
                    }}
                    className="mr-2"
                  />
                  <span>Read - View recycling data</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes('write')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPermissions([...selectedPermissions, 'write']);
                      } else {
                        setSelectedPermissions(selectedPermissions.filter(p => p !== 'write'));
                      }
                    }}
                    className="mr-2"
                  />
                  <span>Write - Submit recycling data</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes('analytics')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPermissions([...selectedPermissions, 'analytics']);
                      } else {
                        setSelectedPermissions(selectedPermissions.filter(p => p !== 'analytics'));
                      }
                    }}
                    className="mr-2"
                  />
                  <span>Analytics - Access analytics data</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName('');
                  setSelectedPermissions(['read']);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newKeyName && selectedPermissions.length > 0) {
                    createApiKey();
                    setShowCreateModal(false);
                    setNewKeyName('');
                    setSelectedPermissions(['read']);
                  }
                }}
                disabled={!newKeyName || selectedPermissions.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show Generated API Key */}
      {showApiKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">API Key Created Successfully</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                ⚠️ Save this API key securely. You won't be able to see it again!
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded mb-4 font-mono text-sm break-all">
              {showApiKey}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => copyToClipboard(showApiKey)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowApiKey(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                I've Saved It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Usage Stats */}
      {selectedKeyUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">API Usage Statistics</h3>
            
            {selectedKeyUsage.length === 0 ? (
              <p className="text-gray-500">No usage data yet</p>
            ) : (
              <div className="space-y-4">
                {selectedKeyUsage.map((stat, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">{stat.method}</span>{' '}
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {stat.endpoint}
                        </code>
                      </div>
                      <span className="text-sm text-gray-600">
                        {stat.total_requests} requests
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Avg Response Time:</span>{' '}
                        <span className="font-medium">
                          {Math.round(stat.avg_response_time)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Success Rate:</span>{' '}
                        <span className="font-medium text-green-600">
                          {((stat.successful_requests / stat.total_requests) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Errors:</span>{' '}
                        <span className="font-medium text-red-600">
                          {stat.error_requests}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedKeyUsage(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiKeys; 