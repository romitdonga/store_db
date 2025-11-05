const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.validateId = (req, res, next) => {
  const id = req.params.id;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid ID format',
      statusCode: 400
    });
  }
  next();
};

exports.validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid pagination parameters',
      statusCode: 400
    });
  }
  
  req.pagination = { page, limit };
  next();
};

exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

exports.logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};