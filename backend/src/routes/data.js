/**
 * Data Routes
 * Main dashboard data endpoints
 */

import { Hono } from 'hono';

const app = new Hono();

// GET /api/data - Get main dashboard data
app.get('/', async (c) => {
  try {
    const { start_date, end_date, member_id, program_type } = c.req.query();
    const db = c.env.DB;
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (start_date) {
      whereConditions.push('p.delivery_date >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('p.delivery_date <= ?');
      params.push(end_date);
    }
    
    if (member_id) {
      whereConditions.push('s.member_id = ?');
      params.push(member_id);
    }
    
    if (program_type && program_type !== 'all') {
      whereConditions.push('p.program_type = ?');
      params.push(program_type);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // Get total weight and item count
    const totals = await db.prepare(`
      SELECT 
        COALESCE(SUM(p.weight_oz) / 16.0, 0) as totalLbsCollected,
        COUNT(*) as totalItems,
        COUNT(DISTINCT p.store_id) as activeStores,
        COUNT(DISTINCT DATE(p.delivery_date)) as activeDays
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
    `).bind(...params).first();
    
    // Get material breakdown
    const materialBreakdown = await db.prepare(`
      SELECT 
        COALESCE(mt.name, 'Unknown') as material,
        COALESCE(mt.code, 'UNKNOWN') as code,
        COUNT(*) as count,
        SUM(p.weight_oz) / 16.0 as weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN material_types mt ON p.material_type_id = mt.id
      ${whereClause}
      GROUP BY mt.id, mt.name, mt.code
      ORDER BY weight_lbs DESC
    `).bind(...params).all();
    
    // Get program type breakdown
    const programBreakdown = await db.prepare(`
      SELECT 
        p.program_type,
        COUNT(*) as count,
        SUM(p.weight_oz) / 16.0 as weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      GROUP BY p.program_type
      ORDER BY weight_lbs DESC
    `).bind(...params).all();
    
    // Get recent warehouse sessions
    const warehouseSessions = await db.prepare(`
      SELECT 
        ws.id,
        ws.started_at,
        ws.ended_at,
        u.username as operator_name,
        ws.packages_processed,
        ws.total_weight_lbs,
        ws.average_processing_time_seconds
      FROM warehouse_sessions ws
      LEFT JOIN users u ON ws.operator_id = u.id
      ORDER BY ws.started_at DESC
      LIMIT 10
    `).all();
    
    // Get end of life outcomes
    const endOfLifeOutcomes = await db.prepare(`
      SELECT 
        COALESCE(p.end_of_life_outcome, 'Pending') as outcome,
        COUNT(*) as count,
        SUM(p.weight_oz) / 16.0 as weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      GROUP BY p.end_of_life_outcome
      ORDER BY weight_lbs DESC
    `).bind(...params).all();
    
    // Get store rankings
    const storeRankings = await db.prepare(`
      SELECT 
        s.name as store_name,
        s.city,
        s.state,
        COUNT(*) as packages_collected,
        SUM(p.weight_oz) / 16.0 as total_weight_lbs
      FROM stores s
      LEFT JOIN packages p ON s.id = p.store_id
      ${whereClause ? whereClause.replace('WHERE', 'WHERE s.id = p.store_id AND') : ''}
      GROUP BY s.id, s.name, s.city, s.state
      ORDER BY total_weight_lbs DESC
      LIMIT 10
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        totalLbsCollected: totals?.totalLbsCollected || 0,
        totalItems: totals?.totalItems || 0,
        activeStores: totals?.activeStores || 0,
        activeDays: totals?.activeDays || 0,
        materialBreakdown: materialBreakdown.results || [],
        programBreakdown: programBreakdown.results || [],
        warehouseSessions: warehouseSessions.results || [],
        endOfLifeOutcomes: endOfLifeOutcomes.results || [],
        storeRankings: storeRankings.results || [],
        filters: {
          start_date,
          end_date,
          member_id,
          program_type
        }
      }
    });
    
  } catch (error) {
    console.error('Dashboard data error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;