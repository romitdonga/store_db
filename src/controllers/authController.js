const Joi = require('joi');
const authService = require('../services/authService');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().required(),
  role: Joi.string().valid('OWNER', 'EMPLOYEE').optional()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

exports.login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'AuthenticationError', message: err.message, statusCode: 401 });
    }
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { error } = refreshSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid refresh token' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'AuthenticationError', message: 'Invalid or expired refresh token', statusCode: 401 });
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'ValidationError', message: error.details[0].message, statusCode: 400 });
    }

    const user = await authService.register(req.body, req.user.role);
    res.status(201).json(user);
  } catch (err) {
    if (err.message === 'Only owners can register') {
      return res.status(403).json({ error: 'AuthorizationError', message: err.message, statusCode: 403 });
    }
    next(err);
  }
};