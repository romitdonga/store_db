const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listProducts = async (filters = {}, pagination = {}) => {
  const { category, search, sortBy = "createdAt", order = "desc" } = filters;
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const where = {};
  if (category) where.category = category;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
    sort: { sortBy, order },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.createProduct = async (data) => {
  return prisma.product.create({ data });
};

exports.updateProduct = async (id, data) => {
  return prisma.product.update({
    where: { id },
    data
  });
};

exports.deleteProduct = async (id) => {
  return prisma.product.delete({ where: { id } });
};

exports.getProductById = async (id) => {
  return prisma.product.findUnique({ where: { id } });
};

exports.getLowStockProducts = async () => {
  return prisma.product.findMany({
    where: {
      stockQuantity: {
        lt: prisma.product.fields.minStockAlert
      }
    }
  });
};