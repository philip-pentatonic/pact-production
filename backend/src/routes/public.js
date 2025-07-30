/**
 * Public Routes
 * Public-facing endpoints that don't require authentication
 */

import { Hono } from 'hono';

const app = new Hono();

// GET /api/public/contamination - Get contamination data
app.get('/contamination', async (c) => {
  try {
    const { start_date, end_date, member_id } = c.req.query();
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
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // Get contamination rates by material type
    const contaminationByMaterial = await db.prepare(`
      SELECT 
        mt.name as material_type,
        mt.code,
        COUNT(*) as total_packages,
        SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) as contaminated_packages,
        ROUND(SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as contamination_rate
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN material_types mt ON p.material_type_id = mt.id
      ${whereClause}
      GROUP BY mt.id, mt.name, mt.code
      ORDER BY contamination_rate DESC
    `).bind(...params).all();
    
    // Get contamination trends over time
    const contaminationTrends = await db.prepare(`
      SELECT 
        DATE(p.delivery_date) as date,
        COUNT(*) as total_packages,
        SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) as contaminated_packages,
        ROUND(SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as contamination_rate
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
      GROUP BY DATE(p.delivery_date)
      ORDER BY date DESC
      LIMIT 30
    `).bind(...params).all();
    
    // Get overall contamination stats
    const overallStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_packages,
        SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) as contaminated_packages,
        ROUND(SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as contamination_rate,
        SUM(p.weight_oz) / 16.0 as total_weight_lbs,
        SUM(CASE WHEN p.is_contaminated = 1 THEN p.weight_oz ELSE 0 END) / 16.0 as contaminated_weight_lbs
      FROM packages p
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
    `).bind(...params).first();
    
    // Get contamination by store
    const contaminationByStore = await db.prepare(`
      SELECT 
        s.name as store_name,
        s.city,
        COUNT(*) as total_packages,
        SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) as contaminated_packages,
        ROUND(SUM(CASE WHEN p.is_contaminated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as contamination_rate
      FROM stores s
      LEFT JOIN packages p ON s.id = p.store_id
      ${whereClause ? whereClause.replace('WHERE', 'WHERE s.id = p.store_id AND') : ''}
      GROUP BY s.id, s.name, s.city
      HAVING total_packages > 0
      ORDER BY contamination_rate DESC
      LIMIT 20
    `).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        overallStats: overallStats || {
          total_packages: 0,
          contaminated_packages: 0,
          contamination_rate: 0,
          total_weight_lbs: 0,
          contaminated_weight_lbs: 0
        },
        byMaterial: contaminationByMaterial.results || [],
        trends: contaminationTrends.results || [],
        byStore: contaminationByStore.results || [],
        filters: {
          start_date,
          end_date,
          member_id
        }
      }
    });
    
  } catch (error) {
    console.error('Contamination data error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/public/stats - Get public statistics
app.get('/stats', async (c) => {
  try {
    const db = c.env.DB;
    
    // Get overall stats
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_packages,
        SUM(weight_oz) / 16.0 as total_weight_lbs,
        COUNT(DISTINCT store_id) as total_stores,
        COUNT(DISTINCT member_id) as total_members
      FROM packages p
      JOIN stores s ON p.store_id = s.id
    `).first();
    
    // Get stats by program type
    const programStats = await db.prepare(`
      SELECT 
        program_type,
        COUNT(*) as count,
        SUM(weight_oz) / 16.0 as weight_lbs
      FROM packages
      GROUP BY program_type
      ORDER BY weight_lbs DESC
    `).all();
    
    return c.json({
      success: true,
      data: {
        overall: stats || {},
        byProgram: programStats.results || []
      }
    });
    
  } catch (error) {
    console.error('Public stats error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;