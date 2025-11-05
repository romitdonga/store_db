const Joi = require('joi');
const salesService = require('../services/salesService');

const itemSchema = Joi.object({
  productId: Joi.string().required(),
  qty: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required()
});

const createSaleSchema = Joi.object({
  customerName: Joi.string().required(),
  customerPhone: Joi.string().required(),
  items: Joi.array().items(itemSchema).min(1).required(),
  discount: Joi.number().min(0).default(0),
  status: Joi.string().valid('PAID', 'PENDING').default('PAID'),
  paymentMethod: Joi.string().optional()
});

const listSalesSchema = Joi.object({
  userId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

exports.createSale = async (req, res, next) => {
  try {
    const { error } = createSaleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const sale = await salesService.createSale(req.body, req.user.id);
    res.status(201).json({ sale, message: 'Stock updated' });
  } catch (err) {
    if (err.message.includes('Insufficient stock') || err.message.includes('not found')) {
      return res.status(400).json({ error: 'ValidationError', message: err.message, statusCode: 400 });
    }
    next(err);
  }
};

exports.listSales = async (req, res, next) => {
  try {
    const { error, value } = listSalesSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const result = await salesService.listSales(
      {
        userId: value.userId,
        startDate: value.startDate,
        endDate: value.endDate
      },
      { page: value.page, limit: value.limit }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await salesService.getSaleById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'NotFound', message: 'Sale not found', statusCode: 404 });
    }
    res.json(sale);
  } catch (err) {
    next(err);
  }
};