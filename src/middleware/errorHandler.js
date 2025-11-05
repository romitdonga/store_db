const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'DuplicateError',
      message: 'Resource already exists',
      statusCode: 409
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Resource not found',
      statusCode: 404
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Invalid token',
      statusCode: 401
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Token expired',
      statusCode: 401
    });
  }

  // Validation errors (already handled by controllers)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name || 'Error',
      message: err.message,
      statusCode: err.statusCode
    });
  }

  // Default error
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong',
    statusCode: 500
  });
};

module.exports = errorHandler;