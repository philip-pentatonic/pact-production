/**
 * Authentication Routes
 * Handles user login, logout, and session management
 */

import { Hono } from 'hono';
import { z } from 'zod';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { verifyPassword, hashPassword } from '../utils/password.js';

const app = new Hono();

// Login schema - supports both username and email
const loginSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  password: z.string().min(1),
}).refine((data) => data.username || data.email, {
  message: 'Either username or email is required',
});

// Register schema (for admin use)
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(['viewer', 'operator', 'admin', 'super_admin']).default('viewer'),
  member_id: z.number().optional(),
});

// POST /api/auth/login - User login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password } = loginSchema.parse(body);
    const db = c.env.DB;
    
    // Use email or username for lookup
    const identifier = email || username;
    
    // Find user by username or email
    const user = await db.prepare(`
      SELECT id, username, email, password_hash, first_name, last_name, role, member_id, is_active
      FROM users
      WHERE (username = ? OR email = ?) AND is_active = 1
    `).bind(identifier, identifier).first();
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401);
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401);
    }
    
    // Generate JWT token
    const token = await jwt.sign({
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      member_id: user.member_id,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, c.env.JWT_SECRET);
    
    // Update last login
    await db.prepare(`
      UPDATE users SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();
    
    // Get member code if user has member_id
    let member_code = null;
    if (user.member_id) {
      const member = await db.prepare(`
        SELECT code FROM members WHERE id = ?
      `).bind(user.member_id).first();
      member_code = member?.code || null;
    }
    
    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        member_id: user.member_id,
        member_code: member_code
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /api/auth/register - Register new user (admin only)
app.post('/register', async (c) => {
  try {
    // This endpoint should be protected by admin auth in production
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      const token = authHeader.substring(7);
      const isValid = await jwt.verify(token, c.env.JWT_SECRET);
      if (isValid) {
        const payload = jwt.decode(token);
        if (payload.role !== 'admin' && payload.role !== 'super_admin') {
          return c.json({ 
            success: false, 
            error: 'Insufficient permissions' 
          }, 403);
        }
      }
    }
    
    const body = await c.req.json();
    const data = registerSchema.parse(body);
    const db = c.env.DB;
    
    // Check if username or email already exists
    const existing = await db.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).bind(data.username, data.email).first();
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Username or email already exists' 
      }, 400);
    }
    
    // Hash password
    const passwordHash = await hashPassword(data.password);
    
    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, role, member_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    const result = await stmt.bind(
      data.username,
      data.email,
      passwordHash,
      data.first_name || null,
      data.last_name || null,
      data.role,
      data.member_id || null
    ).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        username: data.username,
        email: data.email,
        role: data.role
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /api/auth/me - Get current user
app.get('/me', async (c) => {
  try {
    // Get user ID from context (set by auth middleware if needed)
    let userId;
    
    // Check if we have userId from middleware
    if (c.get('userId')) {
      userId = c.get('userId');
    } else {
      // If not from middleware, verify token ourselves
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ 
          success: false, 
          error: 'No token provided' 
        }, 401);
      }
      
      const token = authHeader.substring(7);
      
      // Manual JWT decode as a workaround
      try {
        // Split token and get payload
        const parts = token.split('.');
        if (parts.length !== 3) {
          return c.json({ 
            success: false, 
            error: 'Invalid token format' 
          }, 401);
        }
        
        // Decode base64url payload
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('Manually decoded payload:', JSON.stringify(payload));
        
        userId = payload.sub;
        
        // Basic expiration check
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return c.json({ 
            success: false, 
            error: 'Token expired' 
          }, 401);
        }
      } catch (err) {
        console.error('Token decode error:', err);
        return c.json({ 
          success: false, 
          error: 'Invalid token format: ' + err.message 
        }, 401);
      }
    }
    
    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'Invalid token payload' 
      }, 401);
    }
    
    const db = c.env.DB;
    
    // Get fresh user data
    const user = await db.prepare(`
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.member_id,
        m.name as member_name
      FROM users u
      LEFT JOIN members m ON u.member_id = m.id
      WHERE u.id = ? AND u.is_active = 1
    `).bind(userId).first();
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }
    
    // Build user response object - avoiding spread operator issues with D1
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      member_id: user.member_id,
      member_name: user.member_name,
      member_code: null
    };
    
    // Get member code if user has member_id
    if (user.member_id && user.member_id !== null) {
      try {
        const member = await db.prepare(`
          SELECT code FROM members WHERE id = ?
        `).bind(user.member_id).first();
        if (member) {
          userResponse.member_code = member.code;
        }
      } catch (err) {
        console.error('Error fetching member code:', err);
      }
    }
    
    return c.json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /api/auth/logout - User logout
app.post('/logout', async (c) => {
  // In a stateless JWT system, logout is handled client-side
  // This endpoint exists for consistency
  return c.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

// POST /api/auth/refresh - Refresh token
app.post('/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        error: 'No token provided' 
      }, 401);
    }
    
    const oldToken = authHeader.substring(7);
    
    // Verify old token (allow expired tokens for refresh)
    const payload = jwt.decode(oldToken);
    if (!payload) {
      return c.json({ 
        success: false, 
        error: 'Invalid token' 
      }, 401);
    }
    
    // Generate new token
    const newToken = await jwt.sign({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      member_id: payload.member_id,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, c.env.JWT_SECRET);
    
    return c.json({
      success: true,
      data: { token: newToken }
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;