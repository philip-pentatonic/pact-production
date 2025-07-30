import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch material mappings
  const { data: materialMappings, refetch: refetchMappings } = useQuery({
    queryKey: ['material-mappings'],
    queryFn: async () => {
      const response = await axios.get('/api/g2/material-mapping');
      return response.data.data;
    },
    enabled: activeTab === 'materials'
  });

  const tabs = [
    { id: 'profile', name: 'Profile' },
    { id: 'materials', name: 'Material Mapping', role: 'admin' },
    { id: 'system', name: 'System', role: 'admin' },
  ];

  const filteredTabs = tabs.filter(tab => !tab.role || user?.role === 'admin' || user?.role === 'super_admin');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await axios.post('/api/auth/change-password', {
        current_password: formData.get('current_password'),
        new_password: formData.get('new_password'),
      });
      toast.success('Password changed successfully');
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and system settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Info */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.first_name} {user?.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {user?.role}
                  </span>
                </dd>
              </div>
              {user?.member_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.member_name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Change Password */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  required
                  minLength={6}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  minLength={6}
                  className="input"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-md">
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Material Mapping Configuration</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure how G2 materials are categorized for reporting
            </p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dashboard Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recyclable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contamination Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materialMappings?.map((mapping, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mapping.current_category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {mapping.dashboard_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mapping.is_recyclable ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mapping.contamination_type || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">API Version</dt>
              <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Environment</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">API URL</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {import.meta.env.VITE_API_URL || window.location.origin}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}