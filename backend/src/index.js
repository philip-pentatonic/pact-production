/**
 * PACT API - Main Entry Point
 * 
 * Simplified single-tenant API for PACT recycling management
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Route imports
import authRoutes from './routes/auth.js';
import shipmentsRoutes from './routes/shipments.js';
import membersRoutes from './routes/members.js';
import reportsRoutes from './routes/reports.js';
import g2Routes from './routes/g2.js';
import healthRoutes from './routes/health.js';

// Middleware imports
import { errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',  // Allow all origins for development
  credentials: true,
}));

// Health check (no auth required)
app.route('/health', healthRoutes);

// Auth routes (login, logout, etc.)
app.route('/api/auth', authRoutes);

// Protected routes
app.use('/api/*', requireAuth());

// API routes
app.route('/api/shipments', shipmentsRoutes);
app.route('/api/members', membersRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/g2', g2Routes);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ 
    success: false, 
    error: 'Not found' 
  }, 404);
});

export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
};