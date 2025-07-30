/**
 * Kiosk Routes
 * Kiosk activity monitoring and data
 */

import { Hono } from 'hono';

const app = new Hono();

// GET /api/kiosk/activity - Get recent kiosk activity
app.get('/activity', async (c) => {
  try {
    const { limit = '20', member_id } = c.req.query();
    const db = c.env.DB;
    
    // Build WHERE clause
    let whereClause = '';
    let params = [];
    
    if (member_id) {
      whereClause = 'WHERE s.member_id = ?';
      params.push(member_id);
    }
    
    // Get recent kiosk drop-offs
    const activity = await db.prepare(`
      SELECT 
        p.id,
        p.barcode,
        p.created_at,
        p.weight_oz,
        p.weight_oz / 16.0 as weight_lbs,
        p.consumer_email,
        p.consumer_phone,
        p.points_earned,
        s.name as store_name,
        s.city as store_city,
        mt.name as material_type
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN material_types mt ON p.material_type_id = mt.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ?
    `).bind(...params, parseInt(limit)).all();
    
    // Get kiosk stats for today
    const todayStats = await db.prepare(`
      SELECT 
        COUNT(*) as drop_offs_today,
        COALESCE(SUM(p.weight_oz) / 16.0, 0) as weight_lbs_today,
        COUNT(DISTINCT p.store_id) as active_kiosks_today
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} DATE(p.created_at) = DATE('now')
    `).bind(...params).first();
    
    // Get hourly activity for today
    const hourlyActivity = await db.prepare(`
      SELECT 
        strftime('%H', p.created_at) as hour,
        COUNT(*) as drop_offs,
        SUM(p.weight_oz) / 16.0 as weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} DATE(p.created_at) = DATE('now')
      GROUP BY hour
      ORDER BY hour
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        recentActivity: activity.results || [],
        todayStats: todayStats || {
          drop_offs_today: 0,
          weight_lbs_today: 0,
          active_kiosks_today: 0
        },
        hourlyActivity: hourlyActivity.results || []
      }
    });
    
  } catch (error) {
    console.error('Kiosk activity error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/kiosk/status - Get kiosk status
app.get('/status', async (c) => {
  try {
    const { member_id } = c.req.query();
    const db = c.env.DB;
    
    // Build WHERE clause
    let whereClause = '';
    let params = [];
    
    if (member_id) {
      whereClause = 'WHERE member_id = ?';
      params.push(member_id);
    }
    
    // Get all kiosks with their latest activity
    const kiosks = await db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.city,
        s.state,
        s.is_active,
        (
          SELECT MAX(created_at) 
          FROM packages 
          WHERE store_id = s.id
        ) as last_activity,
        (
          SELECT COUNT(*) 
          FROM packages 
          WHERE store_id = s.id 
          AND DATE(created_at) = DATE('now')
        ) as activity_today
      FROM stores s
      ${whereClause}
      ORDER BY s.name
    `).bind(...params).all();
    
    // Calculate status based on last activity
    const now = new Date();
    const kioskStatuses = (kiosks.results || []).map(kiosk => {
      let status = 'offline';
      let statusColor = 'gray';
      
      if (kiosk.last_activity) {
        const lastActivity = new Date(kiosk.last_activity);
        const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
        
        if (hoursSinceActivity < 1) {
          status = 'online';
          statusColor = 'green';
        } else if (hoursSinceActivity < 24) {
          status = 'idle';
          statusColor = 'yellow';
        } else {
          status = 'offline';
          statusColor = 'red';
        }
      }
      
      return {
        ...kiosk,
        status,
        statusColor
      };
    });
    
    return c.json({
      success: true,
      data: {
        kiosks: kioskStatuses,
        summary: {
          total: kioskStatuses.length,
          online: kioskStatuses.filter(k => k.status === 'online').length,
          idle: kioskStatuses.filter(k => k.status === 'idle').length,
          offline: kioskStatuses.filter(k => k.status === 'offline').length
        }
      }
    });
    
  } catch (error) {
    console.error('Kiosk status error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;