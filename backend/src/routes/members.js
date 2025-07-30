/**
 * Members Route Handler
 * Manages retail partners and their stores
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireRole } from '../middleware/auth.js';

const app = new Hono();

// Validation schemas
const memberSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  contact_email: z.string().email().optional(),
  is_active: z.boolean().default(true),
});

const storeSchema = z.object({
  member_id: z.number(),
  store_name: z.string().min(1),
  store_code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  is_active: z.boolean().default(true),
});

// GET /api/members - List all members
app.get('/', async (c) => {
  try {
    const { include_inactive = 'false' } = c.req.query();
    const db = c.env.DB;
    
    let sql = `
      SELECT 
        m.*,
        COUNT(DISTINCT s.id) as store_count,
        COUNT(DISTINCT ps.id) as shipment_count
      FROM members m
      LEFT JOIN stores s ON m.id = s.member_id
      LEFT JOIN pact_shipments ps ON m.id = ps.member_id
    `;
    
    if (include_inactive !== 'true') {
      sql += ' WHERE m.is_active = 1';
    }
    
    sql += ' GROUP BY m.id ORDER BY m.name';
    
    const results = await db.prepare(sql).all();
    
    return c.json({
      success: true,
      data: results.results
    });
    
  } catch (error) {
    console.error('Error fetching members:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/members/:id - Get single member
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const member = await db.prepare(`
      SELECT * FROM members WHERE id = ?
    `).bind(id).first();
    
    if (!member) {
      return c.json({ 
        success: false, 
        error: 'Member not found' 
      }, 404);
    }
    
    // Get member statistics
    const stats = await db.prepare(`
      SELECT 
        COUNT(DISTINCT s.id) as store_count,
        COUNT(DISTINCT ps.id) as shipment_count,
        SUM(ps.weight_lbs) as total_weight,
        MAX(ps.processed_date) as last_shipment_date
      FROM members m
      LEFT JOIN stores s ON m.id = s.member_id
      LEFT JOIN pact_shipments ps ON m.id = ps.member_id
      WHERE m.id = ?
    `).bind(id).first();
    
    return c.json({
      success: true,
      data: {
        ...member,
        stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching member:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /api/members - Create new member (admin only)
app.post('/', requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const data = memberSchema.parse(body);
    const db = c.env.DB;
    
    // Check if code already exists
    const existing = await db.prepare(`
      SELECT id FROM members WHERE code = ?
    `).bind(data.code).first();
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Member code already exists' 
      }, 400);
    }
    
    // Insert member
    const stmt = db.prepare(`
      INSERT INTO members (name, code, contact_email, is_active)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      data.name,
      data.code,
      data.contact_email,
      data.is_active ? 1 : 0
    ).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        ...data
      }
    });
    
  } catch (error) {
    console.error('Error creating member:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// PUT /api/members/:id - Update member (admin only)
app.put('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = memberSchema.partial().parse(body);
    const db = c.env.DB;
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.code !== undefined) {
      updates.push('code = ?');
      params.push(data.code);
    }
    if (data.contact_email !== undefined) {
      updates.push('contact_email = ?');
      params.push(data.contact_email);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return c.json({ 
        success: false, 
        error: 'No fields to update' 
      }, 400);
    }
    
    updates.push('updated_at = datetime("now")');
    params.push(id);
    
    const sql = `UPDATE members SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(sql).bind(...params).run();
    
    return c.json({
      success: true,
      data: { id, ...data }
    });
    
  } catch (error) {
    console.error('Error updating member:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/members/:id/stores - Get member stores
app.get('/:id/stores', async (c) => {
  try {
    const id = c.req.param('id');
    const { include_inactive = 'false' } = c.req.query();
    const db = c.env.DB;
    
    let sql = `
      SELECT 
        s.*,
        COUNT(ps.id) as shipment_count,
        SUM(ps.weight_lbs) as total_weight
      FROM stores s
      LEFT JOIN pact_shipments ps ON s.id = ps.store_id
      WHERE s.member_id = ?
    `;
    
    if (include_inactive !== 'true') {
      sql += ' AND s.is_active = 1';
    }
    
    sql += ' GROUP BY s.id ORDER BY s.store_name';
    
    const stmt = db.prepare(sql);
    const results = await stmt.bind(id).all();
    
    return c.json({
      success: true,
      data: results.results
    });
    
  } catch (error) {
    console.error('Error fetching stores:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /api/members/:id/stores - Create store for member
app.post('/:id/stores', requireRole('admin'), async (c) => {
  try {
    const member_id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const data = storeSchema.parse({ ...body, member_id });
    const db = c.env.DB;
    
    // Check if member exists
    const member = await db.prepare(`
      SELECT id FROM members WHERE id = ?
    `).bind(member_id).first();
    
    if (!member) {
      return c.json({ 
        success: false, 
        error: 'Member not found' 
      }, 404);
    }
    
    // Check for duplicate store code
    if (data.store_code) {
      const existing = await db.prepare(`
        SELECT id FROM stores 
        WHERE member_id = ? AND store_code = ?
      `).bind(member_id, data.store_code).first();
      
      if (existing) {
        return c.json({ 
          success: false, 
          error: 'Store code already exists for this member' 
        }, 400);
      }
    }
    
    // Insert store
    const stmt = db.prepare(`
      INSERT INTO stores (
        member_id, store_name, store_code, address, city, state, 
        zip_code, country, latitude, longitude, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      data.member_id,
      data.store_name,
      data.store_code,
      data.address,
      data.city,
      data.state,
      data.zip_code,
      data.country,
      data.latitude,
      data.longitude,
      data.is_active ? 1 : 0
    ).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        ...data
      }
    });
    
  } catch (error) {
    console.error('Error creating store:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;