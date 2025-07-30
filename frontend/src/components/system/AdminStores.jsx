import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../config';

function AdminStores() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stores'); // stores, inventory, requests
  const [showAddStore, setShowAddStore] = useState(false);
  const [filter, setFilter] = useState('all'); // all, with-kiosk, without-kiosk, low-inventory

  // Fetch stores from API
  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/stores'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const filteredStores = stores.filter(store => {
    if (filter === 'all') return true;
    if (filter === 'with-kiosk') return store.store_type === 'with_kiosk';
    if (filter === 'without-kiosk') return store.store_type === 'without_kiosk';
    if (filter === 'low-inventory') return store.kits_remaining !== null && store.kits_remaining <= 1;
    return true;
  });

  const kitRequests = [
    {
      id: 'REQ-001',
      storeId: 'PACT-002',
      storeName: "Kiehl's Los Angeles",
      requestDate: new Date('2024-01-14'),
      status: 'pending',
      quantity: 3,
      currentInventory: 2
    },
    {
      id: 'REQ-002',
      storeId: 'PACT-003',
      storeName: 'Aesop Chicago',
      requestDate: new Date('2024-01-13'),
      status: 'shipped',
      quantity: 3,
      currentInventory: 1,
      trackingNumber: '1Z999AA10123456784'
    }
  ];

  const updateKitInventory = async (storeId, newCount) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/stores/kit-inventory'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: storeId,
          kit_count: newCount
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setStores(stores.map(store => 
          store.id === storeId ? { ...store, kits_remaining: data.kit_count } : store
        ));
        return true;
      }
    } catch (error) {
      console.error('Failed to update kit inventory:', error);
      return false;
    }
  };

  const requestKitReorder = async (storeId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/kit-requests'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: 'store_reorder',
          quantity: quantity || 3,
          notes: `Automatic reorder for store ${storeId}`
        })
      });

      if (response.ok) {
        alert('Kit reorder request submitted successfully!');
        return true;
      }
    } catch (error) {
      console.error('Failed to request kit reorder:', error);
      return false;
    }
  };

  const renderStoresTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'with-kiosk', 'without-kiosk', 'low-inventory'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All Stores' :
               f === 'with-kiosk' ? 'With Kiosk' :
               f === 'without-kiosk' ? 'Without Kiosk' :
               'Low Inventory'}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowAddStore(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Store
        </button>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Programs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Box Inventory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStores.map(store => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    PLT-{String(store.id).padStart(3, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{store.name}</p>
                      <p className="text-sm text-gray-500">{store.member_name}</p>
                      <p className="text-xs text-gray-400">{store.address || 'Address not available'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        store.store_type === 'with_kiosk' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {store.store_type === 'with_kiosk' ? 'Kiosk' : 'No Kiosk'}
                      </span>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mr-1 mb-1">
                          In-Store
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.kits_remaining !== null ? (
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${
                          store.kits_remaining <= 1 ? 'text-red-600' : 
                          store.kits_remaining <= 3 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {store.kits_remaining}
                        </p>
                        <p className="text-xs text-gray-500">boxes left</p>
                        {store.kits_remaining <= 1 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full mt-1">
                            Low Stock!
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{store.contact_name || 'Contact not set'}</p>
                      <p className="text-gray-500">{store.contact_email || 'Email not set'}</p>
                      <p className="text-gray-500">{store.contact_phone || 'Phone not set'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">-</p>
                      <p className="text-gray-500">
                        Created: {new Date(store.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedStore(store)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Inventory Alert */}
      {stores.filter(s => s.kits_remaining !== null && s.kits_remaining <= 1).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-red-800 font-medium">Low Inventory Alert</h3>
          </div>
          <p className="text-red-700 text-sm mt-2">
            {stores.filter(s => s.kits_remaining !== null && s.kits_remaining <= 1).length} store(s) have only 1 recycling container left and need restocking.
          </p>
        </div>
      )}
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Box Inventory Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Stores</p>
            <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Well Stocked</p>
            <p className="text-2xl font-bold text-green-900">
              {stores.filter(s => s.kits_remaining !== null && s.kits_remaining > 3).length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600">Low Stock (2-3 boxes)</p>
            <p className="text-2xl font-bold text-yellow-900">
              {stores.filter(s => s.kits_remaining !== null && s.kits_remaining >= 2 && s.kits_remaining <= 3).length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600">Critical (≤1 box)</p>
            <p className="text-2xl font-bold text-red-900">
              {stores.filter(s => s.kits_remaining !== null && s.kits_remaining <= 1).length}
            </p>
          </div>
        </div>

        {/* Inventory by Store */}
        <div className="space-y-2">
          {stores
            .filter(s => s.kits_remaining !== null)
            .sort((a, b) => a.kits_remaining - b.kits_remaining)
            .map(store => (
              <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{store.name}</p>
                  <p className="text-sm text-gray-500">{store.member_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateKitInventory(store.id, Math.max(0, store.kits_remaining - 1))}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      title="Decrease inventory"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className={`text-xl font-bold ${
                      store.kits_remaining <= 1 ? 'text-red-600' : 
                      store.kits_remaining <= 3 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {store.kits_remaining}
                    </span>
                    <button
                      onClick={() => updateKitInventory(store.id, store.kits_remaining + 1)}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      title="Increase inventory"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">boxes</p>
                    <p className="text-xs text-gray-500">Created: {new Date(store.created_at).toLocaleDateString()}</p>
                  </div>
                  {store.kits_remaining <= 1 && (
                    <button 
                      onClick={() => requestKitReorder(store.id, 3)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Order Kit
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
        
        {/* Low Inventory Alert */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-900">Automatic Low Inventory Notifications</h4>
              <p className="text-sm text-yellow-700 mt-1">
                When a store reaches 1 or fewer recycling kits, the system will automatically:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                <li>Send a notification to store managers and admins</li>
                <li>Flag the store in the inventory dashboard</li>
                <li>Enable quick reorder buttons for immediate action</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequestsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Kit Requests & Fulfillment</h3>
        </div>
        <div className="divide-y">
          {kitRequests.map(request => (
            <div key={request.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{request.storeName}</p>
                  <p className="text-sm text-gray-500">
                    Request ID: {request.id} • Requested: {request.requestDate.toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Current inventory: {request.currentInventory} box(es) • Requesting: {request.quantity} boxes
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    request.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {request.status === 'pending' ? 'Pending' : 'Shipped'}
                  </span>
                  {request.trackingNumber && (
                    <p className="text-sm text-gray-600 mt-2">
                      Tracking: {request.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
              {request.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Approve & Ship
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                    Modify Quantity
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mail-back Label Requests */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Mail-back Label Requests</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">This Week</p>
              <p className="text-2xl font-bold text-blue-900">47</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">234</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">92%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Mail-back labels are automatically generated when consumers request them through the consumer app.
          </p>
        </div>
      </div>
    </div>
  );

  // Add Store Modal
  const [newStore, setNewStore] = useState({
    memberName: '',
    storeName: '',
    storeType: 'without-kiosk',
    programTypes: [],
    address: '',
    city: '',
    state: '',
    zip: '',
    contact: '',
    email: '',
    phone: '',
    boxInventory: 3
  });

  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/stores'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: newStore.memberName === "Kiehl's" ? 1 : 2, // Simple mapping for demo
          name: newStore.storeName,
          store_type: newStore.storeType,
          city: newStore.city,
          state: newStore.state,
          address: newStore.address,
          zip: newStore.zip,
          contact_name: newStore.contact,
          contact_email: newStore.email,
          contact_phone: newStore.phone,
          kits_remaining: newStore.boxInventory,
          program_types: newStore.programTypes
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh stores list
        fetchStores();
        // Reset form and close modal
        setNewStore({
          memberName: '',
          storeName: '',
          storeType: 'without-kiosk',
          programTypes: [],
          address: '',
          city: '',
          state: '',
          zip: '',
          contact: '',
          email: '',
          phone: '',
          boxInventory: 3
        });
        setShowAddStore(false);
      } else {
        const error = await response.json();
        console.error('Failed to add store:', error);
      }
    } catch (error) {
      console.error('Failed to add store:', error);
    }
  };

  const AddStoreModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Store</h2>
          <button
            onClick={() => setShowAddStore(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddStore} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Brand
              </label>
              <select
                value={newStore.memberName}
                onChange={(e) => setNewStore({ ...newStore, memberName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select member...</option>
                <option value="Kiehl's">Kiehl's</option>
                <option value="Aesop">Aesop</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={newStore.storeName}
                onChange={(e) => setNewStore({ ...newStore, storeName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Type
              </label>
              <select
                value={newStore.storeType}
                onChange={(e) => setNewStore({ ...newStore, storeType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="with-kiosk">With Kiosk</option>
                <option value="without-kiosk">Without Kiosk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Types
              </label>
              <div className="space-y-2">
                {['In-Store', 'Mail-Back', 'In-Office'].map(program => (
                  <label key={program} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newStore.programTypes.includes(program)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewStore({ ...newStore, programTypes: [...newStore.programTypes, program] });
                        } else {
                          setNewStore({ ...newStore, programTypes: newStore.programTypes.filter(p => p !== program) });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{program}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={newStore.address}
                onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={newStore.city}
                onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={newStore.state}
                onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                value={newStore.zip}
                onChange={(e) => setNewStore({ ...newStore, zip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                pattern="[0-9]{5}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Box Inventory
              </label>
              <input
                type="number"
                value={newStore.boxInventory}
                onChange={(e) => setNewStore({ ...newStore, boxInventory: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={newStore.contact}
                onChange={(e) => setNewStore({ ...newStore, contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={newStore.email}
                onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={newStore.phone}
                onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAddStore(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Store
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stores & Inventory Management</h1>
        <p className="text-gray-600">Manage platform store locations, box inventory, and fulfillment</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border p-1 mb-6">
        <div className="flex space-x-1">
          {[
            { id: 'stores', label: 'All Stores', icon: '🏪' },
            { id: 'inventory', label: 'Box Inventory', icon: '📦' },
            { id: 'requests', label: 'Requests & Fulfillment', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'stores' && renderStoresTab()}
      {activeTab === 'inventory' && renderInventoryTab()}
      {activeTab === 'requests' && renderRequestsTab()}

      {/* Add Store Modal */}
      {showAddStore && <AddStoreModal />}
    </div>
  );
}

export default AdminStores; 