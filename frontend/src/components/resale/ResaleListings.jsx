import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../config';

function ResaleListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    sold: 'bg-blue-100 text-blue-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    removed: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const tenantCode = localStorage.getItem('activeTenant') || '';
      console.log('Fetching listings for tenant:', tenantCode);
      
      // Add timestamp to prevent caching
      const url = `${getApiUrl('/api/admin/resale/listings')}?t=${Date.now()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Code': tenantCode
        },
        cache: 'no-cache'
      });

      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      console.log('Received listings:', data.listings?.length || 0);
      setListings(data.listings || []);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateListingStatus = async (listingId, newStatus) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/resale/listings/${listingId}/status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'X-Tenant-Code': localStorage.getItem('activeTenant') || ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      await fetchListings();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesStatus = selectedStatus === 'all' || listing.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      listing.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const categories = [...new Set(listings.map(l => l.category))].filter(Boolean);

  if (loading) return <div className="p-4">Loading listings...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Resale Listings</h2>
              <p className="text-sm text-gray-600 mt-1">Manage marketplace inventory</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Add New Listing
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by SKU, title, or brand..."
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="removed">Removed</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{listings.length}</div>
              <div className="text-sm text-gray-600">Total Listings</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {listings.filter(l => l.status === 'active').length}
              </div>
              <div className="text-sm text-green-700">Active</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {listings.filter(l => l.status === 'sold').length}
              </div>
              <div className="text-sm text-blue-700">Sold</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                ${listings.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.listing_price || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-purple-700">Total Value</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">
                {listings.reduce((sum, l) => sum + (l.views || 0), 0)}
              </div>
              <div className="text-sm text-orange-700">Total Views</div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                    <p className="text-xs text-gray-500">SKU: {listing.sku}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[listing.status]}`}>
                    {listing.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Brand: {listing.brand}</p>
                  <p>Size: {listing.size} | Color: {listing.color}</p>
                  <p>Condition: {listing.condition}</p>
                  <p>Category: {listing.category}</p>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">${listing.listing_price}</p>
                    {listing.original_price && (
                      <p className="text-xs text-gray-500 line-through">${listing.original_price}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{listing.views || 0} views</p>
                    <p>{listing.likes || 0} likes</p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Edit
                  </button>
                  {listing.status === 'active' && (
                    <button
                      onClick={() => updateListingStatus(listing.id, 'removed')}
                      className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                  {listing.status === 'draft' && (
                    <button
                      onClick={() => updateListingStatus(listing.id, 'active')}
                      className="flex-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResaleListings;