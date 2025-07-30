/**
 * Admin Routes
 * Administrative endpoints for warehouse operations
 */

import { Hono } from 'hono';

const app = new Hono();

// GET /api/admin/warehouse/analytics - Get warehouse analytics
app.get('/warehouse/analytics', async (c) => {
  try {
    const { days = '7', member_id } = c.req.query();
    const db = c.env.DB;
    
    // Calculate date range
    let startDate, endDate;
    const daysInt = parseInt(days);
    
    if (daysInt < 0) {
      // Negative value means specific year
      const year = Math.abs(daysInt);
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else if (daysInt === 9999) {
      // All time
      startDate = '2020-01-01';
      endDate = new Date().toISOString().split('T')[0];
    } else {
      // Last N days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysInt);
      startDate = startDate.toISOString().split('T')[0];
      endDate = endDate.toISOString().split('T')[0];
    }
    
    // Build WHERE clause
    let whereClause = 'WHERE ws.started_at >= ? AND ws.started_at <= ?';
    let params = [startDate, endDate];
    
    if (member_id) {
      // For warehouse sessions, we need to filter by packages in the session
      // This is more complex but ensures accurate filtering
    }
    
    // Get warehouse session stats
    const sessionStats = await db.prepare(`
      SELECT 
        COUNT(DISTINCT ws.id) as total_sessions,
        COUNT(DISTINCT ws.operator_id) as unique_operators,
        SUM(ws.packages_processed) as total_packages_processed,
        SUM(ws.total_weight_lbs) as total_weight_processed,
        AVG(ws.packages_processed) as avg_packages_per_session,
        AVG(ws.total_weight_lbs) as avg_weight_per_session,
        AVG(ws.average_processing_time_seconds) as avg_processing_time
      FROM warehouse_sessions ws
      ${whereClause}
    `).bind(...params).first();
    
    // Get operator performance
    const operatorPerformance = await db.prepare(`
      SELECT 
        u.username as operator_name,
        COUNT(ws.id) as sessions_count,
        SUM(ws.packages_processed) as total_packages,
        SUM(ws.total_weight_lbs) as total_weight,
        AVG(ws.average_processing_time_seconds) as avg_processing_time
      FROM warehouse_sessions ws
      JOIN users u ON ws.operator_id = u.id
      ${whereClause}
      GROUP BY ws.operator_id, u.username
      ORDER BY total_packages DESC
      LIMIT 10
    `).bind(...params).all();
    
    // Get hourly productivity
    const hourlyProductivity = await db.prepare(`
      SELECT 
        strftime('%H', ws.started_at) as hour,
        COUNT(ws.id) as sessions_count,
        SUM(ws.packages_processed) as packages_processed,
        AVG(ws.average_processing_time_seconds) as avg_processing_time
      FROM warehouse_sessions ws
      ${whereClause}
      GROUP BY hour
      ORDER BY hour
    `).bind(...params).all();
    
    // Get recent sessions
    const recentSessions = await db.prepare(`
      SELECT 
        ws.id,
        ws.started_at,
        ws.ended_at,
        u.username as operator_name,
        ws.packages_processed,
        ws.total_weight_lbs,
        ws.average_processing_time_seconds,
        ROUND((julianday(ws.ended_at) - julianday(ws.started_at)) * 24 * 60, 2) as duration_minutes
      FROM warehouse_sessions ws
      LEFT JOIN users u ON ws.operator_id = u.id
      ORDER BY ws.started_at DESC
      LIMIT 20
    `).all();
    
    // Get processing efficiency trends
    const efficiencyTrends = await db.prepare(`
      SELECT 
        DATE(ws.started_at) as date,
        COUNT(ws.id) as sessions,
        SUM(ws.packages_processed) as packages,
        AVG(ws.average_processing_time_seconds) as avg_time_per_package
      FROM warehouse_sessions ws
      ${whereClause}
      GROUP BY DATE(ws.started_at)
      ORDER BY date DESC
      LIMIT 30
    `).bind(...params).all();
    
    return c.json({
      success: true,
      sessionStats: {
        totalSessions: sessionStats?.total_sessions || 0,
        uniqueOperators: sessionStats?.unique_operators || 0,
        totalPackagesProcessed: sessionStats?.total_packages_processed || 0,
        totalWeightProcessed: sessionStats?.total_weight_processed || 0,
        avgPackagesPerSession: sessionStats?.avg_packages_per_session || 0,
        avgWeightPerSession: sessionStats?.avg_weight_per_session || 0,
        avgProcessingTime: sessionStats?.avg_processing_time || 0
      },
      operatorPerformance: operatorPerformance.results || [],
      hourlyProductivity: hourlyProductivity.results || [],
      recentSessions: recentSessions.results || [],
      efficiencyTrends: efficiencyTrends.results || [],
      filters: {
        days,
        startDate,
        endDate,
        member_id
      }
    });
    
  } catch (error) {
    console.error('Warehouse analytics error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/admin/users - Get all users
app.get('/users', async (c) => {
  try {
    const db = c.env.DB;
    
    const users = await db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.member_id,
        u.is_active,
        u.created_at,
        u.last_login,
        m.name as member_name
      FROM users u
      LEFT JOIN members m ON u.member_id = m.id
      ORDER BY u.created_at DESC
    `).all();
    
    return c.json({
      success: true,
      data: users.results || []
    });
    
  } catch (error) {
    console.error('Users list error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/admin/system/health - Get system health
app.get('/system/health', async (c) => {
  try {
    const db = c.env.DB;
    
    // Get database stats
    const dbStats = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM packages) as total_packages,
        (SELECT COUNT(*) FROM stores) as total_stores,
        (SELECT COUNT(*) FROM members) as total_members,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM warehouse_sessions) as total_sessions
    `).first();
    
    // Get recent activity
    const recentActivity = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM packages WHERE DATE(created_at) = DATE('now')) as packages_today,
        (SELECT COUNT(*) FROM warehouse_sessions WHERE DATE(started_at) = DATE('now')) as sessions_today,
        (SELECT MAX(created_at) FROM packages) as last_package_at,
        (SELECT MAX(started_at) FROM warehouse_sessions) as last_session_at
    `).first();
    
    return c.json({
      success: true,
      data: {
        database: dbStats || {},
        activity: recentActivity || {},
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('System health error:', error);
    return c.json({ 
      success: false, 
      error: error.message,
      status: 'unhealthy'
    }, 500);
  }
});

export default app;