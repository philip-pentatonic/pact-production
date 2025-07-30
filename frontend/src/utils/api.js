// API utility functions with demo mode support

/**
 * Make an authenticated API call with demo mode support
 * In demo mode, returns mock data instead of making real API calls
 */
export async function apiCall(url, options = {}) {
  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
  const token = localStorage.getItem('token');
  
  // Add auth header if token exists
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  // In demo mode, return mock data for certain endpoints
  if (DEMO_MODE) {
    // Parse the URL to get the endpoint
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Mock responses for common endpoints
    if (path.includes('/api/data')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          stats: {
            totalPackages: 1250,
            totalWeight: 3420.5,
            uniqueUsers: 342,
            averageScore: 85.5
          },
          recentActivity: [],
          materialBreakdown: [
            { material_type: 'Plastic', percentage: 45 },
            { material_type: 'Glass', percentage: 30 },
            { material_type: 'Metal', percentage: 15 },
            { material_type: 'Paper', percentage: 10 }
          ]
        })
      };
    }
    
    if (path.includes('/api/analytics/trends')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          trends: [],
          summary: {
            totalVolume: 0,
            growthRate: 0,
            topMaterial: 'Plastic'
          }
        })
      };
    }
    
    if (path.includes('/api/analytics/average-metrics')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          metrics: {
            avgContaminationRate: 12.5,
            avgRecyclingScore: 85.5,
            avgPackageWeight: 2.8
          }
        })
      };
    }
    
    if (path.includes('/api/notifications')) {
      return {
        ok: true,
        json: async () => ({
          notifications: [],
          unread_count: 0
        })
      };
    }
    
    if (path.includes('/api/admin/warehouse/analytics')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          sessions: [],
          summary: {
            totalSessions: 0,
            totalPackages: 0,
            totalWeight: 0
          }
        })
      };
    }
    
    // For other endpoints, return a basic success response
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] })
    };
  }
  
  // In production mode, make the actual API call
  return fetch(url, options);
}

/**
 * Get demo data for specific components
 */
export function getDemoData(dataType) {
  const demoData = {
    dashboard: {
      totalPackages: 1250,
      monthlyGrowth: 15.5,
      totalWeight: 3420.5,
      averageScore: 85.5,
      activeKiosks: 12,
      recentActivity: [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          user_id: 'DEMO001',
          package_count: 3,
          total_weight: 2.5,
          recycling_score: 92
        }
      ],
      materialBreakdown: [
        { material_type: 'Plastic', percentage: 45 },
        { material_type: 'Glass', percentage: 30 },
        { material_type: 'Metal', percentage: 15 },
        { material_type: 'Paper', percentage: 10 }
      ]
    },
    analytics: {
      contamination: {
        overall_rate: 12.5,
        by_material: [
          { material: 'Plastic', rate: 8.2 },
          { material: 'Glass', rate: 15.3 },
          { material: 'Metal', rate: 6.1 }
        ],
        trends: []
      },
      performance: {
        processingTime: 45.2,
        accuracy: 94.5,
        throughput: 125.3
      }
    }
  };
  
  return demoData[dataType] || {};
}