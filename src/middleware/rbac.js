module.exports = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ error: 'Insufficient role', statusCode: 403 });
  next();
};