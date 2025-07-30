import { useQuery } from '@tanstack/react-query';
import { 
  ChartBarIcon, 
  TruckIcon, 
  BuildingStorefrontIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { formatNumber, formatWeight } from '@/utils/format';
import DashboardCard from '@/components/DashboardCard';
import TrendChart from '@/components/TrendChart';
import MaterialBreakdown from '@/components/MaterialBreakdown';

export default function Dashboard() {
  // Fetch summary statistics
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await axios.get('/api/reports/summary', {
        params: {
          start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        }
      });
      return response.data.data;
    }
  });

  // Fetch trend data
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      const response = await axios.get('/api/reports/trends', {
        params: {
          start_date: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          group_by: 'month'
        }
      });
      return response.data.data;
    }
  });

  // Fetch material breakdown
  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['dashboard-materials'],
    queryFn: async () => {
      const response = await axios.get('/api/reports/materials', {
        params: {
          start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        }
      });
      return response.data.data;
    }
  });

  const isLoading = summaryLoading || trendsLoading || materialsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Weight',
      value: formatWeight(summary?.total_weight || 0),
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      name: 'Packages Processed',
      value: formatNumber(summary?.total_packages || 0),
      icon: TruckIcon,
      color: 'bg-green-500',
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      name: 'Active Members',
      value: summary?.total_members || 0,
      icon: BuildingStorefrontIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Contamination Rate',
      value: `${summary?.contamination_rate || 0}%`,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: '-2.1%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of recycling operations for the last 30 days
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <DashboardCard key={stat.name} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Weight Processed Over Time
          </h2>
          <TrendChart data={trends || []} />
        </div>

        {/* Material Breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Material Breakdown
          </h2>
          <MaterialBreakdown data={materials || []} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Kiehl's Union Square - 125 packages
                  </p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <span className="text-sm text-gray-600">245.8 lbs</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sephora Times Square - 89 packages
                  </p>
                  <p className="text-sm text-gray-500">4 hours ago</p>
                </div>
                <span className="text-sm text-gray-600">178.2 lbs</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Ulta Beauty Chelsea - 156 packages
                  </p>
                  <p className="text-sm text-gray-500">6 hours ago</p>
                </div>
                <span className="text-sm text-gray-600">312.4 lbs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}