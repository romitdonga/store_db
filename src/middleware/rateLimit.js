const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'RateLimitError', message, statusCode: 429 },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests, please try again later'
);

const strictLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many requests, please try again later'
);

module.exports = {
  authLimiter,
  generalLimiter,
  strictLimiter
};