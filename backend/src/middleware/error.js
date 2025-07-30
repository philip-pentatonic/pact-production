/**
 * Error Handling Middleware
 */

export function errorHandler(err, c) {
  console.error('Unhandled error:', err);
  
  // Zod validation errors
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: 'Validation error',
      details: err.errors
    }, 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return c.json({
      success: false,
      error: 'Authentication error',
      message: err.message
    }, 401);
  }
  
  // Database errors
  if (err.message?.includes('SQLITE') || err.message?.includes('D1')) {
    return c.json({
      success: false,
      error: 'Database error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : 'Internal database error'
    }, 500);
  }
  
  // Foreign key constraint errors
  if (err.message?.includes('FOREIGN KEY')) {
    return c.json({
      success: false,
      error: 'Reference error',
      message: 'Referenced record does not exist'
    }, 400);
  }
  
  // Unique constraint errors
  if (err.message?.includes('UNIQUE')) {
    return c.json({
      success: false,
      error: 'Duplicate error',
      message: 'A record with this value already exists'
    }, 409);
  }
  
  // Default error response
  return c.json({
    success: false,
    error: 'Internal server error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred'
  }, 500);
}