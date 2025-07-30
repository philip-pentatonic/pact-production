/**
 * G2 Integration Routes
 * Handles SFTP file uploads and processing from G2 PACT system
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireRole } from '../middleware/auth.js';
import { parseCSV } from '../utils/csv.js';
import { processPactData } from '../services/g2-processor.js';

const app = new Hono();

// File upload schema
const uploadSchema = z.object({
  filename: z.string(),
  content: z.string(),
  upload_date: z.string().optional(),
});

// POST /api/g2/upload - Handle G2 file upload
app.post('/upload', requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const { filename, content, upload_date } = uploadSchema.parse(body);
    const db = c.env.DB;
    
    // Verify G2 token if provided
    const token = c.req.header('X-G2-Token');
    if (token && token !== c.env.G2_UPLOAD_TOKEN) {
      return c.json({ 
        success: false, 
        error: 'Invalid G2 token' 
      }, 401);
    }
    
    // Create upload record
    const uploadStmt = db.prepare(`
      INSERT INTO g2_uploads (
        upload_date, file_name, file_type, status, created_by
      ) VALUES (?, ?, 'csv', 'processing', ?)
    `);
    
    const uploadResult = await uploadStmt.bind(
      upload_date || new Date().toISOString(),
      filename,
      c.get('userId')
    ).run();
    
    const uploadId = uploadResult.meta.last_row_id;
    
    // Parse CSV content
    const records = parseCSV(content);
    
    // Update record count
    await db.prepare(`
      UPDATE g2_uploads 
      SET records_count = ?, started_at = datetime('now')
      WHERE id = ?
    `).bind(records.length, uploadId).run();
    
    // Process records asynchronously
    c.executionCtx.waitUntil(
      processPactData(db, uploadId, records)
    );
    
    return c.json({
      success: true,
      data: {
        upload_id: uploadId,
        filename,
        records_count: records.length,
        status: 'processing'
      }
    });
    
  } catch (error) {
    console.error('G2 upload error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/g2/uploads - List recent uploads
app.get('/uploads', async (c) => {
  try {
    const { limit = '20', offset = '0' } = c.req.query();
    const db = c.env.DB;
    
    const stmt = db.prepare(`
      SELECT 
        u.*,
        users.email as uploaded_by_email
      FROM g2_uploads u
      LEFT JOIN users ON u.created_by = users.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const results = await stmt.bind(
      parseInt(limit),
      parseInt(offset)
    ).all();
    
    // Get total count
    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM g2_uploads'
    ).first();
    
    return c.json({
      success: true,
      data: {
        uploads: results.results,
        total: countResult.total
      }
    });
    
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/g2/uploads/:id - Get upload details
app.get('/uploads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const stmt = db.prepare(`
      SELECT 
        u.*,
        users.email as uploaded_by_email
      FROM g2_uploads u
      LEFT JOIN users ON u.created_by = users.id
      WHERE u.id = ?
    `);
    
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'Upload not found' 
      }, 404);
    }
    
    // Get processing stats if available
    if (result.status === 'completed' || result.status === 'failed') {
      const statsStmt = db.prepare(`
        SELECT 
          COUNT(*) as total_processed,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
        FROM pact_shipments
        WHERE import_batch = ?
      `);
      
      const stats = await statsStmt.bind(id).first();
      result.processing_stats = stats;
    }
    
    return c.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching upload:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /api/g2/reprocess/:id - Reprocess failed upload
app.post('/reprocess/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    // Get upload details
    const upload = await db.prepare(`
      SELECT * FROM g2_uploads WHERE id = ?
    `).bind(id).first();
    
    if (!upload) {
      return c.json({ 
        success: false, 
        error: 'Upload not found' 
      }, 404);
    }
    
    if (upload.status === 'processing') {
      return c.json({ 
        success: false, 
        error: 'Upload is already being processed' 
      }, 400);
    }
    
    // Reset status
    await db.prepare(`
      UPDATE g2_uploads 
      SET status = 'processing', 
          started_at = datetime('now'),
          error_details = NULL
      WHERE id = ?
    `).bind(id).run();
    
    // TODO: Implement reprocessing logic
    // This would require storing the original file content
    
    return c.json({
      success: true,
      data: {
        upload_id: id,
        status: 'reprocessing'
      }
    });
    
  } catch (error) {
    console.error('Error reprocessing upload:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/g2/material-mapping - Get material mapping configuration
app.get('/material-mapping', async (c) => {
  try {
    const db = c.env.DB;
    
    const stmt = db.prepare(`
      SELECT * FROM pact_material_mapping
      ORDER BY current_category
    `);
    
    const results = await stmt.all();
    
    return c.json({
      success: true,
      data: results.results
    });
    
  } catch (error) {
    console.error('Error fetching material mapping:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /api/g2/material-mapping - Update material mapping
app.post('/material-mapping', requireRole('admin'), async (c) => {
  try {
    const mappings = await c.req.json();
    const db = c.env.DB;
    
    // Validate input
    if (!Array.isArray(mappings)) {
      return c.json({ 
        success: false, 
        error: 'Invalid input format' 
      }, 400);
    }
    
    // Start transaction
    await db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Clear existing mappings
      await db.prepare('DELETE FROM pact_material_mapping').run();
      
      // Insert new mappings
      const stmt = db.prepare(`
        INSERT INTO pact_material_mapping (
          current_category, new_category, dashboard_label,
          is_recyclable, is_contamination, contamination_type
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const mapping of mappings) {
        await stmt.bind(
          mapping.current_category,
          mapping.new_category,
          mapping.dashboard_label,
          mapping.is_recyclable ? 1 : 0,
          mapping.is_contamination ? 1 : 0,
          mapping.contamination_type
        ).run();
      }
      
      await db.prepare('COMMIT').run();
      
      return c.json({
        success: true,
        data: {
          mappings_updated: mappings.length
        }
      });
      
    } catch (error) {
      await db.prepare('ROLLBACK').run();
      throw error;
    }
    
  } catch (error) {
    console.error('Error updating material mapping:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;