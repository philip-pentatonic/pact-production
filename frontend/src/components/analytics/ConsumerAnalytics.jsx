import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  MousePointer,
  MapPin,
  TrendingUp,
  Package,
  Calendar,
  Activity,
  Eye,
  Download,
  ShoppingBag
} from 'lucide-react';
import { getApiUrl } from '../../config';

// Simple UI component replacements
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 pb-6 ${className}`}>{children}</div>
);

const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (newValue) => {
    onValueChange(newValue);
    setIsOpen(false);
  };
  
  const childrenArray = React.Children.toArray(children);
  const trigger = childrenArray.find(child => child.type === SelectTrigger);
  const content = childrenArray.find(child => child.type === SelectContent);
  
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {React.cloneElement(trigger, { value, isOpen })}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg">
          {React.cloneElement(content, { onSelect: handleSelect })}
        </div>
      )}
    </div>
  );
};

const SelectTrigger = ({ children, className = '', value, isOpen }) => (
  <button className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}>
    <div className="flex items-center justify-between">
      {React.cloneElement(children, { value })}
      <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>
);

const SelectValue = ({ value }) => <span>{value || 'Select...'}</span>;

const SelectContent = ({ children, onSelect }) => (
  <div className="py-1">
    {React.Children.map(children, child => 
      React.cloneElement(child, { onSelect })
    )}
  </div>
);

const SelectItem = ({ value, children, onSelect }) => (
  <button
    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
    onClick={() => onSelect(value)}
  >
    {children}
  </button>
);

const Tabs = ({ value, onValueChange, children, defaultValue, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || value);
  
  React.useEffect(() => {
    if (value !== undefined) setActiveTab(value);
  }, [value]);
  
  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) onValueChange(newValue);
  };
  
  const childrenArray = React.Children.toArray(children);
  const list = childrenArray.find(child => child.type === TabsList);
  const contents = childrenArray.filter(child => child.type === TabsContent);
  
  return (
    <div className={className}>
      {React.cloneElement(list, { value: activeTab, onValueChange: handleTabChange })}
      {contents.map(content => 
        React.cloneElement(content, { key: content.props.value, isActive: content.props.value === activeTab })
      )}
    </div>
  );
};

const TabsList = ({ children, value, onValueChange }) => (
  <div className="flex space-x-1 border-b border-gray-200 mb-4">
    {React.Children.map(children, child => 
      React.cloneElement(child, { isActive: child.props.value === value, onClick: () => onValueChange(child.props.value) })
    )}
  </div>
);

const TabsTrigger = ({ value, children, isActive, onClick }) => (
  <button
    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
      isActive 
        ? 'text-blue-600 border-blue-600' 
        : 'text-gray-500 border-transparent hover:text-gray-700'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, isActive, className = '' }) => 
  isActive ? <div className={className}>{children}</div> : null;

const ConsumerAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    summary: {
      uniqueUsers: 0,
      uniqueSessions: 0,
      eventCounts: [],
      topPages: []
    },
    locationAnalytics: [],
    userJourneys: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      // Fetch summary data
      const summaryResponse = await fetch(
        `${getApiUrl('/admin/analytics/summary')}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const summaryData = await summaryResponse.json();

      // Fetch location analytics
      const locationResponse = await fetch(
        `${getApiUrl('/admin/analytics/locations')}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const locationData = await locationResponse.json();

      setAnalytics({
        summary: summaryData.data || summaryData,
        locationAnalytics: locationData.data || [],
        userJourneys: []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format event names for display
  const formatEventName = (eventName) => {
    return eventName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Colors for charts
  const COLORS = ['#10B981', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Calculate conversion funnel data
  const funnelData = (analytics.summary.eventCounts || [])
    .filter(event => ['page_view', 'app_sign_up', 'app_login', 'location_click', 'location_set_default'].includes(event.event_type))
    .map(event => ({
      name: formatEventName(event.event_type),
      value: event.count
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate engagement metrics
  const engagementData = (analytics.summary.eventCounts || [])
    .filter(event => ['location_search', 'location_filter', 'packaging_search', 'mail_back_view'].includes(event.event_type))
    .map(event => ({
      name: formatEventName(event.event_type),
      value: event.count
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Consumer App Analytics</h2>
          <p className="text-gray-600 mt-1">Track user behavior and engagement metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.uniqueUsers?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500">Active app users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.uniqueSessions?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500">User sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sign-ups</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.eventCounts?.find(e => e.event_type === 'app_sign_up')?.count || 0}
            </div>
            <p className="text-xs text-gray-500">New registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location Searches</CardTitle>
            <MapPin className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.eventCounts?.find(e => e.event_type === 'location_search')?.count || 0}
            </div>
            <p className="text-xs text-gray-500">Store lookups</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Page Analytics</TabsTrigger>
          <TabsTrigger value="locations">Location Analytics</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Distribution</CardTitle>
              <CardDescription>Breakdown of all tracked events</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.summary.eventCounts?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="event_type" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tickFormatter={(value) => formatEventName(value)}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatEventName(value)}
                    formatter={(value) => [value.toLocaleString(), 'Count']}
                  />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Analytics Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages in the app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.summary.topPages?.map((page, index) => (
                  <div key={page.page_path} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-gray-500">#{index + 1}</div>
                      <div>
                        <p className="font-medium">{page.page_path}</p>
                        <p className="text-sm text-gray-500">{page.views.toLocaleString()} views</p>
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(page.views / analytics.summary.topPages[0]?.views) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Analytics Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Interactions</CardTitle>
              <CardDescription>Most popular store locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Location</th>
                      <th className="text-left py-2">Brand</th>
                      <th className="text-center py-2">Has Kiosk</th>
                      <th className="text-right py-2">Clicks</th>
                      <th className="text-right py-2">Set as Default</th>
                      <th className="text-right py-2">Total Interactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.locationAnalytics?.map((location) => (
                      <tr key={location.location_name} className="border-b">
                        <td className="py-2">{location.location_name}</td>
                        <td className="py-2">{location.location_brand}</td>
                        <td className="py-2 text-center">
                          {location.has_kiosk ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-2 text-right">{location.clicks}</td>
                        <td className="py-2 text-right">{location.set_defaults}</td>
                        <td className="py-2 text-right font-semibold">{location.interactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Journey Funnel</CardTitle>
              <CardDescription>Conversion rates through key actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Users']} />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Engagement</CardTitle>
              <CardDescription>Usage of key app features</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Events']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* PWA Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">PWA Installs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.summary.eventCounts?.find(e => e.event_type === 'pwa_installed')?.count || 0}
                </div>
                <p className="text-xs text-gray-500">App installations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Offline Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.summary.eventCounts?.find(e => e.event_type === 'pwa_offline_use')?.count || 0}
                </div>
                <p className="text-xs text-gray-500">Offline sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Packaging Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.summary.eventCounts?.find(e => e.event_type === 'packaging_search')?.count || 0}
                </div>
                <p className="text-xs text-gray-500">Item lookups</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsumerAnalytics; 