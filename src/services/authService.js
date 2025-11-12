const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate Access Token (short-lived: 1 hour)
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Generate Refresh Token (long-lived: 7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

exports.login = async (username, password) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    const { passwordHash, refreshToken: _, ...userData } = user;
    return {
      accessToken,
      refreshToken,
      user: userData
    };
  } catch (err) {
    throw err;
  }
};

exports.refresh = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, user.role);

    return {
      accessToken: newAccessToken,
      refreshToken // Return same refresh token
    };
  } catch (err) {
    throw err;
  }
};

exports.logout = async (userId) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
    return { message: 'Logged out successfully' };
  } catch (err) {
    throw err;
  }
};

exports.register = async (data, requesterRole) => {
  if (requesterRole !== 'OWNER') throw new Error('Only owners can register');

  const { username, email, phone, password, role } = data;
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      username,
      email: email || null,
      phone: phone || null,
      passwordHash,
      role: role === 'OWNER' || role === 'EMPLOYEE' ? role : 'EMPLOYEE'
    }
  });
};