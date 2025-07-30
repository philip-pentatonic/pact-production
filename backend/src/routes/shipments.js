/**
 * Shipments Route Handler
 * Handles PACT shipment data queries and operations
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireRole } from '../middleware/auth.js';

const app = new Hono();

// Validation schemas
const shipmentsQuerySchema = z.object({
  member_id: z.string().optional(),
  store_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  material_type: z.string().optional(),
  is_contamination: z.enum(['true', 'false']).optional(),
  page: z.string().default('1'),
  limit: z.string().default('100'),
});

// GET /api/shipments - List shipments with filters
app.get('/', async (c) => {
  try {
    const query = shipmentsQuerySchema.parse(c.req.query());
    const db = c.env.DB;
    
    // Build query
    let sql = `
      SELECT 
        s.*,
        m.name as member_name,
        st.store_name,
        p.name as program_name
      FROM pact_shipments s
      LEFT JOIN members m ON s.member_id = m.id
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN program_types p ON s.program_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (query.member_id) {
      sql += ' AND s.member_id = ?';
      params.push(query.member_id);
    }
    
    if (query.store_id) {
      sql += ' AND s.store_id = ?';
      params.push(query.store_id);
    }
    
    if (query.start_date) {
      sql += ' AND s.shipping_date >= ?';
      params.push(query.start_date);
    }
    
    if (query.end_date) {
      sql += ' AND s.shipping_date <= ?';
      params.push(query.end_date);
    }
    
    if (query.material_type) {
      sql += ' AND s.material_type = ?';
      params.push(query.material_type);
    }
    
    if (query.is_contamination !== undefined) {
      sql += ' AND s.is_contamination = ?';
      params.push(query.is_contamination === 'true' ? 1 : 0);
    }
    
    // Add pagination
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;
    
    sql += ' ORDER BY s.processed_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // Execute query
    const stmt = db.prepare(sql);
    const results = await stmt.bind(...params).all();
    
    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM pact_shipments s
      WHERE 1=1
    `;
    
    const countParams = params.slice(0, -2); // Remove limit/offset
    if (query.member_id) countSql += ' AND s.member_id = ?';
    if (query.store_id) countSql += ' AND s.store_id = ?';
    if (query.start_date) countSql += ' AND s.shipping_date >= ?';
    if (query.end_date) countSql += ' AND s.shipping_date <= ?';
    if (query.material_type) countSql += ' AND s.material_type = ?';
    if (query.is_contamination !== undefined) countSql += ' AND s.is_contamination = ?';
    
    const countStmt = db.prepare(countSql);
    const countResult = await countStmt.bind(...countParams).first();
    
    return c.json({
      success: true,
      data: {
        shipments: results.results,
        pagination: {
          page,
          limit,
          total: countResult.total,
          total_pages: Math.ceil(countResult.total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/shipments/summary - Get summary statistics
app.get('/summary', async (c) => {
  try {
    const { member_id, start_date, end_date } = c.req.query();
    const db = c.env.DB;
    
    let sql = `
      SELECT 
        COUNT(DISTINCT package_key) as total_packages,
        COUNT(*) as total_records,
        SUM(weight_lbs) as total_weight,
        SUM(CASE WHEN is_contamination = 1 THEN weight_lbs ELSE 0 END) as contamination_weight,
        SUM(CASE WHEN is_contamination = 0 THEN weight_lbs ELSE 0 END) as recyclable_weight,
        COUNT(DISTINCT member_id) as unique_members,
        COUNT(DISTINCT material_type) as unique_materials
      FROM pact_shipments
      WHERE 1=1
    `;
    
    const params = [];
    
    if (member_id) {
      sql += ' AND member_id = ?';
      params.push(member_id);
    }
    
    if (start_date) {
      sql += ' AND shipping_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND shipping_date <= ?';
      params.push(end_date);
    }
    
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...params).first();
    
    // Calculate contamination rate
    const contaminationRate = result.total_weight > 0 
      ? (result.contamination_weight / result.total_weight * 100).toFixed(2)
      : 0;
    
    return c.json({
      success: true,
      data: {
        ...result,
        contamination_rate: parseFloat(contaminationRate)
      }
    });
    
  } catch (error) {
    console.error('Error fetching summary:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/shipments/:id - Get single shipment
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const stmt = db.prepare(`
      SELECT 
        s.*,
        m.name as member_name,
        st.store_name,
        p.name as program_name
      FROM pact_shipments s
      LEFT JOIN members m ON s.member_id = m.id
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN program_types p ON s.program_id = p.id
      WHERE s.id = ?
    `);
    
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'Shipment not found' 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /api/shipments - Create shipment (admin only)
app.post('/', requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;
    
    // Validate required fields
    if (!body.unique_id || !body.member_id) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400);
    }
    
    // Insert shipment
    const stmt = db.prepare(`
      INSERT INTO pact_shipments (
        unique_id, pact_id, tracking_number, member_id, store_id, program_id,
        shipping_date, processed_date, material_type, weight_lbs,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = await stmt.bind(
      body.unique_id,
      body.pact_id,
      body.tracking_number,
      body.member_id,
      body.store_id,
      body.program_id,
      body.shipping_date,
      body.processed_date,
      body.material_type,
      body.weight_lbs
    ).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id
      }
    });
    
  } catch (error) {
    console.error('Error creating shipment:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;