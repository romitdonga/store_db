const Joi = require('joi');
const reportService = require('../services/reportService');

const reportSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  groupBy: Joi.string().valid('day', 'week', 'month').default('day'),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const lowStockSchema = Joi.object({
  threshold: Joi.number().integer().min(1).default(10)
});

exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await reportService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getSalesReport = async (req, res, next) => {
  try {
    const { error, value } = reportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const report = await reportService.getSalesReport(
      value.startDate,
      value.endDate,
      value.groupBy
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const { error, value } = reportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const topProducts = await reportService.getTopProducts(
      value.limit,
      value.startDate,
      value.endDate
    );
    res.json(topProducts);
  } catch (err) {
    next(err);
  }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const { error, value } = lowStockSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const products = await reportService.getLowStockProducts(value.threshold);
    res.json(products);
  } catch (err) {
    next(err);
  }
};