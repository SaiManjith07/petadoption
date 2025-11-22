import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Security Headers Middleware
 * Protects against common web vulnerabilities
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow images from external sources
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Rate Limiting for Authentication Routes
 * Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate Limiting for API Routes
 * Prevents API abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window (increased for admin dashboard)
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiting for Admin Routes (more lenient)
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window for admin
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiting for Pet Creation
 * Prevents spam submissions
 */
export const petCreationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 pet reports per hour
  message: {
    success: false,
    message: 'Too many pet reports submitted. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiting for File Uploads
 * Prevents abuse of file upload system
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 upload requests per hour
  message: {
    success: false,
    message: 'Too many file uploads. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sanitize MongoDB query parameters to prevent NoSQL injection
 */
export const sanitizeQuery = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      
      // Remove dangerous MongoDB operators
      if (typeof value === 'string') {
        // Remove $ operators that could be used for injection
        if (value.startsWith('$')) {
          delete req.query[key];
          return;
        }
        
        // Sanitize regex patterns
        if (key === 'location' || key === 'search') {
          // Escape special regex characters
          req.query[key] = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
      }
      
      // Remove object injection attempts
      if (typeof value === 'object' && value !== null) {
        const stringified = JSON.stringify(value);
        if (stringified.includes('$') || stringified.includes('__proto__')) {
          delete req.query[key];
        }
      }
    });
  }
  
  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      
      // Remove dangerous MongoDB operators
      if (typeof value === 'string' && value.startsWith('$')) {
        delete req.body[key];
      }
      
      // Remove object injection attempts
      if (typeof value === 'object' && value !== null) {
        const stringified = JSON.stringify(value);
        if (stringified.includes('$') || stringified.includes('__proto__')) {
          delete req.body[key];
        }
      }
    });
  }
  
  next();
};

/**
 * Validate MongoDB ObjectId format
 */
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }
  
  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseFloat(maxSize);
      
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          success: false,
          message: `Request size exceeds ${maxSize} limit`,
        });
      }
    }
    next();
  };
};


