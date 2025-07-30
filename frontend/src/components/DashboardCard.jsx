import { clsx } from 'clsx';

export default function DashboardCard({ 
  name, 
  value, 
  icon: Icon, 
  color = 'bg-gray-500',
  change,
  changeType 
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={clsx('rounded-lg p-3', color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {name}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change && (
                <div className={clsx(
                  'ml-2 flex items-baseline text-sm font-semibold',
                  changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}>
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}