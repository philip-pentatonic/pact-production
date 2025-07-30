/**
 * Health Check Routes
 * System status and monitoring endpoints
 */

import { Hono } from 'hono';

const app = new Hono();

// GET /health - Basic health check
app.get('/', async (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'pact-api',
    version: '1.0.0'
  });
});

// GET /health/detailed - Detailed health check
app.get('/detailed', async (c) => {
  const checks = {
    api: 'healthy',
    database: 'unknown',
    timestamp: new Date().toISOString()
  };

  try {
    // Check database connection
    const db = c.env.DB;
    const result = await db.prepare('SELECT 1 as test').first();
    checks.database = result ? 'healthy' : 'unhealthy';
    
    // Check table existence
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('members', 'pact_shipments', 'users')
    `).all();
    
    checks.tables = {
      expected: 3,
      found: tables.results.length,
      status: tables.results.length === 3 ? 'healthy' : 'degraded'
    };
    
    // Get basic stats
    const stats = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM members) as members,
        (SELECT COUNT(*) FROM pact_shipments) as shipments,
        (SELECT COUNT(*) FROM users) as users
    `).first();
    
    checks.stats = stats;
    
  } catch (error) {
    checks.database = 'unhealthy';
    checks.error = error.message;
  }

  const overallStatus = checks.database === 'healthy' ? 'healthy' : 'unhealthy';
  
  return c.json({
    status: overallStatus,
    checks
  }, overallStatus === 'healthy' ? 200 : 503);
});

// GET /health/ready - Readiness check
app.get('/ready', async (c) => {
  try {
    const db = c.env.DB;
    await db.prepare('SELECT 1').first();
    
    return c.json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// GET /health/live - Liveness check
app.get('/live', async (c) => {
  return c.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

export default app;