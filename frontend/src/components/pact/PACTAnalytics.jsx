import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Alert,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip
} from '@mui/material';
import {
  LocalShipping,
  Inventory2,
  Scale,
  Timeline,
  CheckCircle,
  Pending,
  Factory,
  Recycling,
  Assessment,
  TrendingUp
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useTenant } from '../../contexts/TenantContext';
import { formatNumberWithCommas } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const MATERIAL_COLORS = {
  'Plastic': '#FF6B6B',
  'Glass': '#4ECDC4',
  'Metal': '#45B7D1',
  'Paper': '#96CEB4',
  'Mixed': '#FECA57',
  'Other': '#DDA0DD'
};

const PACTAnalytics = () => {
  const { 
    user, 
    members, 
    selectedMemberId, 
    setSelectedMemberId, 
    isPactAdmin, 
    isBrandMember, 
    getCurrentMember, 
    getApiFilters 
  } = useTenant();
  
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedMemberId]);
  
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const filters = getApiFilters();
      const urlParams = new URLSearchParams();
      
      if (dateRange !== 'all') {
        urlParams.append('range', dateRange);
      }
      
      // Add member filter if applicable
      if (filters.member_id) {
        urlParams.append('member_id', filters.member_id);
      }
      
      const queryString = urlParams.toString();
      const url = `${import.meta.env.VITE_API_URL}/pact/analytics${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.data.success) {
        // Transform the API data to match our component structure
        const transformedData = {
          ...response.data,
          // Map API status data to mailback data
          mailbackData: {
            total_sent: response.data.summary?.total_shipments || 0,
            in_transit: response.data.summary?.in_transit || 0,
            delivered: response.data.summary?.completed_shipments || 0,
            pending_shipment: response.data.summary?.pending_shipment || 0,
            avgDeliveryTime: response.data.summary?.avg_delivery_time || 0
          },
          // Map warehouse data from material breakdown
          warehouseData: {
            total_processed: response.data.summary?.total_weight || 0,
            items_accepted: response.data.byMaterial?.reduce((sum, m) => sum + (m.count || 0), 0) || 0,
            items_rejected: 0, // This would need to come from G2 data when available
            processing_rate: response.data.summary?.processing_rate || 0
          },
          // Transform status breakdown to focus on shipping statuses
          statusBreakdown: response.data.statusBreakdown ? 
            response.data.statusBreakdown.map(item => ({
              status: item.status === 'completed' ? 'delivered' : 
                     item.status === 'shipped' ? 'in_transit' : 
                     item.status === 'generated' ? 'pending' : item.status,
              count: item.count
            })) : [],
          // Ensure byProgram data is available
          byProgram: response.data.byProgram || [],
          // Ensure byMaterial data is available
          byMaterial: response.data.byMaterial || [],
          // Map monthly trend data
          monthlyTrend: response.data.monthlyTrend || []
        };
        setAnalytics(transformedData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty analytics structure instead of mock data
      setAnalytics({
        summary: { total_shipments: 0, unique_users: 0, total_weight: 0 },
        mailbackData: { total_sent: 0, in_transit: 0, delivered: 0, pending_shipment: 0, avgDeliveryTime: 0 },
        statusBreakdown: [],
        byProgram: [],
        warehouseData: { total_processed: 0, items_accepted: 0, items_rejected: 0, processing_rate: 0 },
        byMaterial: [],
        monthlyTrend: []
      });
    } finally {
      setLoading(false);
    }
  };
  
  
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">
            {getCurrentMember()?.name || 'PACT'} Analytics Dashboard
          </Typography>
          {isPactAdmin() && getCurrentMember() && (
            <Typography variant="subtitle1" color="text.secondary">
              Viewing data for {getCurrentMember().name}
            </Typography>
          )}
          {isBrandMember() && (
            <Typography variant="subtitle1" color="text.secondary">
              Your beauty recycling analytics
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {isPactAdmin() && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Member</InputLabel>
              <Select
                value={selectedMemberId || 'all'}
                label="Select Member"
                onChange={(e) => setSelectedMemberId(e.target.value === 'all' ? null : e.target.value)}
              >
                <MenuItem value="all">All Members</MenuItem>
                {members.filter(m => m.id !== 1).map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Section 1: Mailback Packages (Logistics) */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LocalShipping sx={{ mr: 1 }} />
          Mailback Packages - Shipping & Logistics
        </Typography>
        
        {/* Mailback Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Inventory2 sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{formatNumberWithCommas(analytics?.mailbackData?.total_sent || analytics?.summary?.total_shipments || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Packages Sent</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <LocalShipping sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{formatNumberWithCommas(analytics?.mailbackData?.in_transit || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">In Transit</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{formatNumberWithCommas(analytics?.mailbackData?.delivered || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">Delivered to G2</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{analytics?.mailbackData?.avgDeliveryTime || '4.2'}</Typography>
              <Typography variant="body2" color="text.secondary">Avg. Days to Delivery</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Shipping Status Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Shipping Status Distribution</Typography>
                {analytics?.statusBreakdown && analytics.statusBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.statusBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <Typography variant="body2" color="text.secondary">
                      No shipping status data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Program Type Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Collection Method</Typography>
                {analytics?.byProgram && analytics.byProgram.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    {analytics.byProgram.map((program, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1">{program.program_name}</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {program.shipment_count} ({program.percentage || (analytics?.summary?.total_shipments > 0 ? Math.round((program.shipment_count / analytics?.summary?.total_shipments) * 100) : 0)}%)
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}>
                          <Box
                            sx={{
                              width: `${program.percentage || (analytics?.summary?.total_shipments > 0 ? Math.round((program.shipment_count / analytics?.summary?.total_shipments) * 100) : 0)}%`,
                              bgcolor: index === 0 ? 'primary.main' : 'secondary.main',
                              height: 24,
                              borderRadius: 1,
                              transition: 'width 0.5s ease-in-out'
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <Typography variant="body2" color="text.secondary">
                      No collection method data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Section 2: Warehouse Operations (G2 Processing) */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Factory sx={{ mr: 1 }} />
          Warehouse Operations - G2 Processing
        </Typography>
        
        {/* Warehouse Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Scale sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{formatNumberWithCommas(analytics?.warehouseData?.total_processed || analytics?.summary?.total_weight || 0, 1)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Weight (lbs)</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Recycling sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{formatNumberWithCommas(analytics?.warehouseData?.items_accepted || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">Items Accepted</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{formatNumberWithCommas(analytics?.warehouseData?.items_rejected || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">Items Rejected</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{analytics?.warehouseData?.processing_rate || 95}%</Typography>
              <Typography variant="body2" color="text.secondary">Acceptance Rate</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Material Type Breakdown */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Material Types Processed</Typography>
                {analytics?.byMaterial && analytics.byMaterial.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics.byMaterial}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="material_type" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="total_weight" fill="#8884d8" name="Weight (lbs)" />
                      <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Item Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                    <Typography variant="body2" color="text.secondary">
                      No material processing data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Material Weight Distribution */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Weight by Material</Typography>
                {analytics?.byMaterial && analytics.byMaterial.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    {analytics.byMaterial.map((material, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip 
                            label={material.material_type} 
                            size="small" 
                            sx={{ 
                              bgcolor: MATERIAL_COLORS[material.material_type] || COLORS[index % COLORS.length],
                              color: 'white'
                            }} 
                          />
                          <Typography variant="body2">
                            {material.total_weight?.toFixed(1) || 0} lbs
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <Typography variant="body2" color="text.secondary">
                      No material weight data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Processing Trend */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Monthly Processing Trend</Typography>
                {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (lbs)" />
                      <Line yAxisId="right" type="monotone" dataKey="shipments" stroke="#82ca9d" name="Shipments" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <Typography variant="body2" color="text.secondary">
                      No monthly trend data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PACTAnalytics;