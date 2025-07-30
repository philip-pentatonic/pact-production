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
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Settings,
  Calculator,
  Calendar,
  AlertCircle,
  Plus,
  Save
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
          {React.cloneElement(content, { onSelect })}
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

const Tabs = ({ value, onValueChange, children, className = '' }) => {
  const childrenArray = React.Children.toArray(children);
  const list = childrenArray.find(child => child.type === TabsList);
  const contents = childrenArray.filter(child => child.type === TabsContent);
  
  return (
    <div className={className}>
      {React.cloneElement(list, { value, onValueChange })}
      {contents.map(content => 
        React.cloneElement(content, { key: content.props.value, isActive: content.props.value === value })
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

const CostTracking = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMember, setSelectedMember] = useState('all');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [costData, setCostData] = useState({
    summary: {},
    trends: [],
    details: [],
    configurations: [],
    allocations: []
  });
  
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    member_id: '',
    program_type: 'STORE_DROPOFF',
    cost_type: 'collection',
    unit_cost: '',
    cost_unit: 'per_lb',
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchMembers();
    fetchCostData();
  }, [selectedMember, timeRange]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(getApiUrl('/members'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setMembers(result.data || []);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const fetchCostData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '365d':
          startDate.setDate(startDate.getDate() - 365);
          break;
      }

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      if (selectedMember !== 'all') {
        params.append('member_id', selectedMember);
      }

      // Fetch program costs
      const costsResponse = await fetch(
        `${getApiUrl('/costs/programs')}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const costsData = await costsResponse.json();

      // Fetch cost trends
      const trendsResponse = await fetch(
        `${getApiUrl('/costs/trends')}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const trendsData = await trendsResponse.json();

      // Fetch configurations
      const configResponse = await fetch(
        `${getApiUrl('/costs/configurations')}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const configData = await configResponse.json();

      // Fetch allocations
      const allocationsResponse = await fetch(
        `${getApiUrl('/costs/allocations')}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const allocationsData = await allocationsResponse.json();

      setCostData({
        summary: costsData.summary || {},
        trends: trendsData.data || [],
        details: costsData.data || [],
        configurations: configData.data || [],
        allocations: allocationsData.data || []
      });
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfiguration = async () => {
    try {
      const response = await fetch(getApiUrl('/costs/configurations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newConfig)
      });

      const result = await response.json();
      if (result.success) {
        showToast('Cost configuration created successfully');
        fetchCostData();
        // Reset form
        setNewConfig({
          member_id: '',
          program_type: 'STORE_DROPOFF',
          cost_type: 'collection',
          unit_cost: '',
          cost_unit: 'per_lb',
          effective_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
      } else {
        showToast(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error creating configuration:', error);
      showToast('Failed to create configuration', 'error');
    }
  };

  const calculateCosts = async (trackingNumber) => {
    try {
      const response = await fetch(getApiUrl('/costs/calculate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tracking_number: trackingNumber })
      });

      const result = await response.json();
      if (result.success) {
        showToast('Costs calculated successfully');
        fetchCostData();
      } else {
        showToast(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error calculating costs:', error);
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Calculate trend indicator
  const getTrendIndicator = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change <= 0 };
  };

  const latestTrend = (costData.trends && costData.trends[0]) || {};
  const previousTrend = (costData.trends && costData.trends[1]) || {};
  const costTrend = getTrendIndicator(latestTrend.total_cost, previousTrend.total_cost);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Cost Tracking</h2>
          <p className="text-gray-600 mt-1">Real-time program costs linked to containers</p>
        </div>
        <div className="flex space-x-4">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {members.map(member => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Program Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costData.summary.total_cost || 0)}</div>
            <div className="flex items-center text-xs text-gray-500">
              {costTrend.isPositive ? (
                <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={costTrend.isPositive ? "text-green-600" : "text-red-600"}>
                {costTrend.value.toFixed(1)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Pound</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costData.summary.avg_cost_per_lb || 0)}
            </div>
            <p className="text-xs text-gray-500">
              {costData.summary.total_weight?.toFixed(0) || 0} lbs total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Item</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costData.summary.avg_cost_per_item || 0)}
            </div>
            <p className="text-xs text-gray-500">
              {costData.summary.total_items?.toLocaleString() || 0} items total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            <Truck className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costData.summary.shipment_count || 0}</div>
            <p className="text-xs text-gray-500">
              Containers processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="containers">Container Costs</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Cost Breakdown Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Distribution</CardTitle>
              <CardDescription>Breakdown by cost category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={Object.entries(costData.summary.cost_breakdown || {})
                      .filter(([key]) => key !== 'material_revenue')
                      .map(([key, value]) => ({
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        value: value
                      }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(costData.summary.cost_breakdown || {}).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Cost Details */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipment Costs</CardTitle>
              <CardDescription>Detailed cost breakdown by tracking number</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Tracking #</th>
                      <th className="text-left py-2">Member</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Weight</th>
                      <th className="text-right py-2">Items</th>
                      <th className="text-right py-2">Total Cost</th>
                      <th className="text-right py-2">$/lb</th>
                      <th className="text-center py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(costData.details || []).slice(0, 10).map((cost) => (
                      <tr key={cost.tracking_number} className="border-b">
                        <td className="py-2 font-mono text-sm">{cost.tracking_number}</td>
                        <td className="py-2">{cost.member_name}</td>
                        <td className="py-2">{new Date(cost.cost_date).toLocaleDateString()}</td>
                        <td className="py-2 text-right">{cost.weight_lbs?.toFixed(1)} lbs</td>
                        <td className="py-2 text-right">{cost.item_count?.toLocaleString() || '-'}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(cost.total_cost)}</td>
                        <td className="py-2 text-right">
                          {cost.weight_lbs > 0 ? formatCurrency(cost.total_cost / cost.weight_lbs) : '-'}
                        </td>
                        <td className="py-2 text-center">
                          <button
                            onClick={() => calculateCosts(cost.tracking_number)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Recalculate costs"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trends</CardTitle>
              <CardDescription>Program costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={(costData.trends || []).slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_cost" 
                    stroke="#8884d8" 
                    name="Total Cost"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_cost_per_shipment" 
                    stroke="#82ca9d" 
                    name="Avg Cost/Shipment"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Efficiency Trends</CardTitle>
              <CardDescription>Cost per pound and per item over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={(costData.trends || []).slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avg_cost_per_lb" 
                    stroke="#ff7300" 
                    name="Cost per Pound"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_cost_per_item" 
                    stroke="#387908" 
                    name="Cost per Item"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Category Trends</CardTitle>
              <CardDescription>Breakdown by cost type over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={(costData.trends || []).slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total_collection_cost" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    name="Collection"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total_processing_cost" 
                    stackId="1"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    name="Processing"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total_transportation_cost" 
                    stackId="1"
                    stroke="#ffc658" 
                    fill="#ffc658"
                    name="Transportation"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total_disposal_cost" 
                    stackId="1"
                    stroke="#ff7c7c" 
                    fill="#ff7c7c"
                    name="Disposal"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Container Costs Tab */}
        <TabsContent value="containers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Container Cost Allocations</CardTitle>
              <CardDescription>Costs allocated to specific containers/bins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Container ID</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Store</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Weight</th>
                      <th className="text-right py-2">Items</th>
                      <th className="text-right py-2">Total Cost</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(costData.allocations || []).map((allocation) => (
                      <tr key={allocation.id} className="border-b">
                        <td className="py-2 font-mono text-sm">{allocation.container_id}</td>
                        <td className="py-2">{allocation.container_type}</td>
                        <td className="py-2">{allocation.store_name || '-'}</td>
                        <td className="py-2">{new Date(allocation.allocation_date).toLocaleDateString()}</td>
                        <td className="py-2 text-right">{allocation.weight_lbs?.toFixed(1)} lbs</td>
                        <td className="py-2 text-right">{allocation.item_count?.toLocaleString() || '-'}</td>
                        <td className="py-2 text-right font-semibold">
                          {formatCurrency(allocation.total_allocated_cost)}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            allocation.status === 'paid' ? 'bg-green-100 text-green-800' :
                            allocation.status === 'invoiced' ? 'bg-blue-100 text-blue-800' :
                            allocation.status === 'allocated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {allocation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurations Tab */}
        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Configurations</CardTitle>
              <CardDescription>Active cost calculation rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Member</th>
                      <th className="text-left py-2">Program</th>
                      <th className="text-left py-2">Cost Type</th>
                      <th className="text-right py-2">Unit Cost</th>
                      <th className="text-left py-2">Unit</th>
                      <th className="text-left py-2">Effective Date</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(costData.configurations || []).map((config) => (
                      <tr key={config.id} className="border-b">
                        <td className="py-2">{config.member_name || 'All Members'}</td>
                        <td className="py-2">{config.program_type}</td>
                        <td className="py-2">{config.cost_type}</td>
                        <td className="py-2 text-right">{formatCurrency(config.unit_cost)}</td>
                        <td className="py-2">{config.cost_unit.replace('_', ' ')}</td>
                        <td className="py-2">{new Date(config.effective_date).toLocaleDateString()}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            !config.end_date || new Date(config.end_date) > new Date() 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {!config.end_date || new Date(config.end_date) > new Date() ? 'Active' : 'Expired'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Add New Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Add Cost Configuration</CardTitle>
              <CardDescription>Create new cost calculation rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member (optional)
                  </label>
                  <select
                    value={newConfig.member_id}
                    onChange={(e) => setNewConfig({...newConfig, member_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Members</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Type
                  </label>
                  <select
                    value={newConfig.program_type}
                    onChange={(e) => setNewConfig({...newConfig, program_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="STORE_DROPOFF">Store Drop-off</option>
                    <option value="MAIL_BACK">Mail Back</option>
                    <option value="CURBSIDE">Curbside</option>
                    <option value="SPECIAL_EVENT">Special Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Type
                  </label>
                  <select
                    value={newConfig.cost_type}
                    onChange={(e) => setNewConfig({...newConfig, cost_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="collection">Collection</option>
                    <option value="processing">Processing</option>
                    <option value="transportation">Transportation</option>
                    <option value="disposal">Disposal</option>
                    <option value="material_sale">Material Sale (Revenue)</option>
                    <option value="admin">Admin</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newConfig.unit_cost}
                    onChange={(e) => setNewConfig({...newConfig, unit_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Unit
                  </label>
                  <select
                    value={newConfig.cost_unit}
                    onChange={(e) => setNewConfig({...newConfig, cost_unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="per_lb">Per Pound</option>
                    <option value="per_item">Per Item</option>
                    <option value="per_container">Per Container</option>
                    <option value="per_shipment">Per Shipment</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={newConfig.effective_date}
                    onChange={(e) => setNewConfig({...newConfig, effective_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={newConfig.notes}
                    onChange={(e) => setNewConfig({...newConfig, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                    placeholder="Additional notes or details..."
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    onClick={handleCreateConfiguration}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Configuration</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostTracking; 