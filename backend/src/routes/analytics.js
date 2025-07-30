/**
 * Analytics Routes
 * Provides analytics data and trends
 */

import { Hono } from 'hono';

const app = new Hono();

// GET /api/analytics/trends - Get trending data
app.get('/trends', async (c) => {
  try {
    const { period = '30', member_id } = c.req.query();
    const db = c.env.DB;
    const periodDays = parseInt(period) || 30;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // Build WHERE clause for member filtering
    let whereClause = 'WHERE p.delivery_date >= ? AND p.delivery_date <= ?';
    const params = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
    
    if (member_id) {
      whereClause += ' AND s.member_id = ?';
      params.push(member_id);
    }
    
    // Get daily weights
    const dailyWeights = await db.prepare(`
      SELECT 
        DATE(p.delivery_date) as date,
        SUM(p.weight_oz) / 16.0 as weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      GROUP BY DATE(p.delivery_date)
      ORDER BY date ASC
    `).bind(...params).all();
    
    // Get material breakdown over time
    const materialTrends = await db.prepare(`
      SELECT 
        DATE(p.delivery_date) as date,
        mt.code as material_type,
        SUM(p.weight_oz) / 16.0 as weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN material_types mt ON p.material_type_id = mt.id
      ${whereClause}
      GROUP BY DATE(p.delivery_date), mt.code
      ORDER BY date ASC, mt.code
    `).bind(...params).all();
    
    // Get program type trends
    const programTrends = await db.prepare(`
      SELECT 
        DATE(p.delivery_date) as date,
        p.program_type,
        COUNT(*) as count,
        SUM(p.weight_oz) / 16.0 as weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      GROUP BY DATE(p.delivery_date), p.program_type
      ORDER BY date ASC
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        dailyWeights: dailyWeights.results || [],
        materialTrends: materialTrends.results || [],
        programTrends: programTrends.results || [],
        period: periodDays,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });
    
  } catch (error) {
    console.error('Analytics trends error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/analytics/performance - Get performance metrics
app.get('/performance', async (c) => {
  try {
    const { days = '30', member_id } = c.req.query();
    const db = c.env.DB;
    
    // Build date filter
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    let whereClause = 'WHERE p.created_at >= ? AND p.created_at <= ?';
    const params = [startDate.toISOString(), endDate.toISOString()];
    
    if (member_id) {
      whereClause += ' AND s.member_id = ?';
      params.push(member_id);
    }
    
    // Get processing times
    const processingTimes = await db.prepare(`
      SELECT 
        AVG(julianday(p.processed_at) - julianday(p.created_at)) * 24 * 60 as avg_processing_minutes,
        MIN(julianday(p.processed_at) - julianday(p.created_at)) * 24 * 60 as min_processing_minutes,
        MAX(julianday(p.processed_at) - julianday(p.created_at)) * 24 * 60 as max_processing_minutes
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      AND p.processed_at IS NOT NULL
    `).bind(...params).first();
    
    // Get hourly distribution
    const hourlyDistribution = await db.prepare(`
      SELECT 
        strftime('%H', p.created_at) as hour,
        COUNT(*) as count
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      GROUP BY hour
      ORDER BY hour
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        processingTimes: processingTimes || {},
        hourlyDistribution: hourlyDistribution.results || [],
        period: days
      }
    });
    
  } catch (error) {
    console.error('Analytics performance error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;