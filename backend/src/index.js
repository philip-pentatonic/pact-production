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
import notificationsRoutes from './routes/notifications.js';
import dataRoutes from './routes/data.js';
import kioskRoutes from './routes/kiosk.js';
import publicRoutes from './routes/public.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

// Middleware imports
import { errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: [
    'https://pact-dashboard.pages.dev',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    '*'
  ],
  credentials: true,
}));

// Health check (no auth required)
app.route('/health', healthRoutes);

// Auth routes (login, logout, etc.)
app.route('/api/auth', authRoutes);

// Public routes (no auth required)
app.route('/api/public', publicRoutes);

// Protected routes
app.use('/api/*', requireAuth());

// API routes
app.route('/api/data', dataRoutes);
app.route('/api/kiosk', kioskRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/shipments', shipmentsRoutes);
app.route('/api/members', membersRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/g2', g2Routes);
app.route('/api/notifications', notificationsRoutes);

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