const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.login = async (username, password) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const { passwordHash, ...userData } = user;
    return { token, user: userData };
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