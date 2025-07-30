import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatNumber, formatWeight } from '@/utils/format';
import { BuildingStorefrontIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Members() {
  const { data: members, isLoading } = useQuery({
    queryKey: ['members-list'],
    queryFn: async () => {
      const response = await axios.get('/api/members');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage retail partners and their locations
            </p>
          </div>
          <button className="btn btn-primary btn-md">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members?.map((member) => (
          <Link
            key={member.id}
            to={`/members/${member.id}`}
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingStorefrontIcon className="h-12 w-12 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {member.code}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {member.name}
                  </dd>
                </dl>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Stores</span>
                <p className="font-medium">{member.store_count || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Shipments</span>
                <p className="font-medium">{formatNumber(member.shipment_count || 0)}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-gray-500">Status</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                member.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}