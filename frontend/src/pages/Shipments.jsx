import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import DataTable from '@/components/DataTable';
import { formatDate, formatWeight } from '@/utils/format';
import { FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function Shipments() {
  const [filters, setFilters] = useState({
    member_id: '',
    store_id: '',
    material_type: '',
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch shipments
  const { data, isLoading } = useQuery({
    queryKey: ['shipments', filters, page],
    queryFn: async () => {
      const response = await axios.get('/api/shipments', {
        params: {
          ...filters,
          page,
          limit: 25
        }
      });
      return response.data.data;
    }
  });

  // Fetch members for filter
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await axios.get('/api/members');
      return response.data.data;
    }
  });

  const columns = [
    {
      header: 'Tracking #',
      accessorKey: 'tracking_number',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {row.original.tracking_number || row.original.unique_id}
        </span>
      )
    },
    {
      header: 'Member',
      accessorKey: 'member_name',
    },
    {
      header: 'Store',
      accessorKey: 'store_name',
    },
    {
      header: 'Date',
      accessorKey: 'shipping_date',
      cell: ({ getValue }) => formatDate(getValue())
    },
    {
      header: 'Material',
      accessorKey: 'material_dashboard_label',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getValue()}
        </span>
      )
    },
    {
      header: 'Weight',
      accessorKey: 'weight_lbs',
      cell: ({ getValue }) => formatWeight(getValue())
    },
    {
      header: 'Contamination',
      accessorKey: 'is_contamination',
      cell: ({ getValue }) => (
        getValue() ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            No
          </span>
        )
      )
    }
  ];

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/reports/export', {
        params: {
          ...filters,
          format: 'csv'
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shipments-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Shipments</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage recycling shipments
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary btn-md"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="btn btn-primary btn-md"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Member</label>
              <select
                className="input"
                value={filters.member_id}
                onChange={(e) => setFilters({ ...filters, member_id: e.target.value })}
              >
                <option value="">All Members</option>
                {members?.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={data?.shipments || []}
          isLoading={isLoading}
          pagination={{
            page,
            pageSize: 25,
            total: data?.pagination?.total || 0,
            totalPages: data?.pagination?.total_pages || 0,
            onPageChange: setPage
          }}
        />
      </div>
    </div>
  );
}