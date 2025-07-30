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
      
      // Manual JWT decode as a workaround for Cloudflare Workers issues
      let payload;
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
        payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        
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
          error: 'Invalid token' 
        }, 401);
      }
      
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