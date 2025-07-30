/**
 * Reports Route Handler
 * Generates analytics and reports for PACT data
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireRole } from '../middleware/auth.js';
import { formatDate, formatWeight } from '../utils/helpers.js';
import { objectsToCSV } from '../utils/csv.js';

const app = new Hono();

// Report query schema
const reportQuerySchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  member_id: z.string().optional(),
  store_id: z.string().optional(),
  group_by: z.enum(['day', 'week', 'month', 'member', 'store', 'material']).default('month'),
  format: z.enum(['json', 'csv']).default('json'),
});

// GET /api/reports/summary - Overall summary statistics
app.get('/summary', async (c) => {
  try {
    const { start_date, end_date, member_id } = c.req.query();
    const db = c.env.DB;
    
    let sql = `
      SELECT 
        COUNT(DISTINCT member_id) as total_members,
        COUNT(DISTINCT store_id) as total_stores,
        COUNT(DISTINCT package_key) as total_packages,
        COUNT(*) as total_shipments,
        SUM(weight_lbs) as total_weight,
        SUM(CASE WHEN is_contamination = 1 THEN weight_lbs ELSE 0 END) as contamination_weight,
        SUM(CASE WHEN is_contamination = 0 THEN weight_lbs ELSE 0 END) as recyclable_weight,
        AVG(package_contamination_rate) as avg_contamination_rate,
        COUNT(DISTINCT material_dashboard_label) as material_types
      FROM pact_shipments
      WHERE 1=1
    `;
    
    const params = [];
    
    if (start_date) {
      sql += ' AND shipping_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND shipping_date <= ?';
      params.push(end_date);
    }
    
    if (member_id) {
      sql += ' AND member_id = ?';
      params.push(member_id);
    }
    
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...params).first();
    
    // Calculate rates
    const contaminationRate = result.total_weight > 0 
      ? (result.contamination_weight / result.total_weight * 100).toFixed(2)
      : 0;
    
    return c.json({
      success: true,
      data: {
        ...result,
        contamination_rate: parseFloat(contaminationRate),
        diversion_rate: parseFloat((100 - contaminationRate).toFixed(2))
      }
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/reports/trends - Time-based trends
app.get('/trends', async (c) => {
  try {
    const query = reportQuerySchema.parse(c.req.query());
    const db = c.env.DB;
    
    // Build date grouping
    let dateGroup;
    switch (query.group_by) {
      case 'day':
        dateGroup = "DATE(shipping_date)";
        break;
      case 'week':
        dateGroup = "DATE(shipping_date, 'weekday 0', '-7 days')";
        break;
      case 'month':
      default:
        dateGroup = "DATE(shipping_date, 'start of month')";
        break;
    }
    
    let sql = `
      SELECT 
        ${dateGroup} as period,
        COUNT(DISTINCT package_key) as packages,
        SUM(weight_lbs) as total_weight,
        SUM(CASE WHEN is_contamination = 1 THEN weight_lbs ELSE 0 END) as contamination_weight,
        SUM(CASE WHEN is_contamination = 0 THEN weight_lbs ELSE 0 END) as recyclable_weight,
        COUNT(DISTINCT member_id) as active_members,
        COUNT(DISTINCT store_id) as active_stores
      FROM pact_shipments
      WHERE shipping_date >= ? AND shipping_date <= ?
    `;
    
    const params = [query.start_date, query.end_date];
    
    if (query.member_id) {
      sql += ' AND member_id = ?';
      params.push(query.member_id);
    }
    
    if (query.store_id) {
      sql += ' AND store_id = ?';
      params.push(query.store_id);
    }
    
    sql += ` GROUP BY period ORDER BY period`;
    
    const stmt = db.prepare(sql);
    const results = await stmt.bind(...params).all();
    
    // Calculate rates for each period
    const data = results.results.map(row => ({
      ...row,
      contamination_rate: row.total_weight > 0 
        ? parseFloat((row.contamination_weight / row.total_weight * 100).toFixed(2))
        : 0
    }));
    
    if (query.format === 'csv') {
      const csv = objectsToCSV(data);
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="pact-trends.csv"'
      });
    }
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error generating trends:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/reports/materials - Material breakdown
app.get('/materials', async (c) => {
  try {
    const { start_date, end_date, member_id } = c.req.query();
    const db = c.env.DB;
    
    let sql = `
      SELECT 
        material_dashboard_label as material,
        COUNT(DISTINCT package_key) as packages,
        COUNT(*) as items,
        SUM(weight_lbs) as total_weight,
        SUM(recycled_pieces) as recycled_pieces,
        SUM(donated_pieces) as donated_pieces,
        AVG(weight_lbs) as avg_weight_per_item,
        is_contamination
      FROM pact_shipments
      WHERE shipping_date >= ? AND shipping_date <= ?
    `;
    
    const params = [start_date, end_date];
    
    if (member_id) {
      sql += ' AND member_id = ?';
      params.push(member_id);
    }
    
    sql += ` 
      GROUP BY material_dashboard_label, is_contamination 
      ORDER BY total_weight DESC
    `;
    
    const stmt = db.prepare(sql);
    const results = await stmt.bind(...params).all();
    
    // Organize by material with contamination breakdown
    const materialMap = new Map();
    
    results.results.forEach(row => {
      const key = row.material;
      if (!materialMap.has(key)) {
        materialMap.set(key, {
          material: key,
          total_weight: 0,
          recyclable_weight: 0,
          contamination_weight: 0,
          packages: 0,
          items: 0,
          recycled_pieces: 0,
          donated_pieces: 0
        });
      }
      
      const material = materialMap.get(key);
      material.total_weight += row.total_weight;
      material.packages = Math.max(material.packages, row.packages);
      material.items += row.items;
      material.recycled_pieces += row.recycled_pieces || 0;
      material.donated_pieces += row.donated_pieces || 0;
      
      if (row.is_contamination) {
        material.contamination_weight += row.total_weight;
      } else {
        material.recyclable_weight += row.total_weight;
      }
    });
    
    const data = Array.from(materialMap.values()).map(m => ({
      ...m,
      contamination_rate: m.total_weight > 0 
        ? parseFloat((m.contamination_weight / m.total_weight * 100).toFixed(2))
        : 0,
      avg_weight_per_package: m.packages > 0 
        ? parseFloat((m.total_weight / m.packages).toFixed(2))
        : 0
    }));
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error generating material report:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/reports/members - Member performance
app.get('/members', requireRole('admin'), async (c) => {
  try {
    const { start_date, end_date } = c.req.query();
    const db = c.env.DB;
    
    const sql = `
      SELECT 
        m.id,
        m.name,
        m.code,
        COUNT(DISTINCT s.store_id) as store_count,
        COUNT(DISTINCT s.package_key) as package_count,
        SUM(s.weight_lbs) as total_weight,
        SUM(CASE WHEN s.is_contamination = 1 THEN s.weight_lbs ELSE 0 END) as contamination_weight,
        MIN(s.shipping_date) as first_shipment,
        MAX(s.shipping_date) as last_shipment,
        COUNT(DISTINCT DATE(s.shipping_date)) as active_days
      FROM members m
      LEFT JOIN pact_shipments s ON m.id = s.member_id
        AND s.shipping_date >= ? AND s.shipping_date <= ?
      WHERE m.is_active = 1
      GROUP BY m.id, m.name, m.code
      ORDER BY total_weight DESC
    `;
    
    const stmt = db.prepare(sql);
    const results = await stmt.bind(start_date, end_date).all();
    
    const data = results.results.map(row => ({
      ...row,
      contamination_rate: row.total_weight > 0 
        ? parseFloat((row.contamination_weight / row.total_weight * 100).toFixed(2))
        : 0,
      avg_weight_per_package: row.package_count > 0 
        ? parseFloat((row.total_weight / row.package_count).toFixed(2))
        : 0
    }));
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error generating member report:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/reports/export - Export detailed data
app.get('/export', requireRole('admin'), async (c) => {
  try {
    const { start_date, end_date, member_id, format = 'csv' } = c.req.query();
    const db = c.env.DB;
    
    let sql = `
      SELECT 
        s.unique_id,
        s.tracking_number,
        m.name as member_name,
        st.store_name,
        s.shipping_date,
        s.processed_date,
        s.material_dashboard_label as material,
        s.weight_lbs,
        s.is_contamination,
        s.contamination_type,
        s.package_contamination_rate,
        s.recycled_pieces,
        s.donated_pieces,
        s.city,
        s.state,
        s.postal_code
      FROM pact_shipments s
      LEFT JOIN members m ON s.member_id = m.id
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.shipping_date >= ? AND s.shipping_date <= ?
    `;
    
    const params = [start_date, end_date];
    
    if (member_id) {
      sql += ' AND s.member_id = ?';
      params.push(member_id);
    }
    
    sql += ' ORDER BY s.shipping_date DESC LIMIT 10000'; // Limit for safety
    
    const stmt = db.prepare(sql);
    const results = await stmt.bind(...params).all();
    
    if (format === 'csv') {
      const csv = objectsToCSV(results.results);
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="pact-export-${start_date}-to-${end_date}.csv"`
      });
    }
    
    return c.json({
      success: true,
      data: results.results
    });
    
  } catch (error) {
    console.error('Error exporting data:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;