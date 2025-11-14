const Joi = require('joi');
const productService = require('../services/productService');

const productSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().valid('SHIRT', 'PANT', 'TSHIRT', 'SHORTS', 'BLAZER', 'JEANS', 'KURTA').required(),
  stockQuantity: Joi.number().integer().min(0).default(0),
  minStockAlert: Joi.number().integer().min(1).default(5),
  costPrice: Joi.number().min(0).default(0),
  sellPrice: Joi.number().min(0).default(0),
  supplier: Joi.string().optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  category: Joi.string().valid('SHIRT', 'PANT', 'TSHIRT', 'SHORTS', 'BLAZER', 'JEANS', 'KURTA').optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  minStockAlert: Joi.number().integer().min(1).optional(),
  costPrice: Joi.number().min(0).optional(),
  sellPrice: Joi.number().min(0).optional(),
  supplier: Joi.string().optional()
});

exports.listProducts = async (req, res, next) => {
  try {
    const { category, search, sortBy = "createdAt", order = "desc", page = 1, limit = 20 } = req.query;
    const result = await productService.listProducts(
      { category, search, sortBy, order },
      { page: parseInt(page), limit: parseInt(limit) }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { error } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'NotFound', message: 'Product not found', statusCode: 404 });
    }
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'NotFound', message: 'Product not found', statusCode: 404 });
    }
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'NotFound', message: 'Product not found', statusCode: 404 });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};