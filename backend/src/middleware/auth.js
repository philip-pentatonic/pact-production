/**
 * Authentication Middleware
 * JWT-based authentication for PACT system
 */

import jwt from '@tsndr/cloudflare-worker-jwt';

export function requireAuth() {
  return async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ 
          success: false, 
          error: 'Unauthorized' 
        }, 401);
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const isValid = await jwt.verify(token, c.env.JWT_SECRET);
      if (!isValid) {
        return c.json({ 
          success: false, 
          error: 'Invalid token' 
        }, 401);
      }
      
      // Decode and set user context
      const payload = jwt.decode(token);
      
      // Set user context
      c.set('userId', payload.sub);
      c.set('userEmail', payload.email);
      c.set('username', payload.username);
      c.set('userRole', payload.role || 'viewer');
      c.set('memberId', payload.member_id);
      
      await next();
    } catch (error) {
      console.error('Auth error:', error);
      return c.json({ 
        success: false, 
        error: 'Invalid token' 
      }, 401);
    }
  };
}

export function requireRole(requiredRole) {
  return async (c, next) => {
    const userRole = c.get('userRole');
    
    const roleHierarchy = {
      'viewer': 1,
      'operator': 2,
      'admin': 3,
      'super_admin': 4
    };
    
    if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
      await next();
    } else {
      return c.json({ 
        success: false, 
        error: 'Insufficient permissions' 
      }, 403);
    }
  };
}