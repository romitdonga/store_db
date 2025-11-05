const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.generateBillNo = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.sales.count({ 
    where: { 
      billNo: { 
        startsWith: `BILL-${year}-` 
      } 
    } 
  });
  return `BILL-${year}-${String(count + 1).padStart(3, '0')}`;
};

exports.createSale = async (data, userId) => {
  const { items, discount = 0, ...rest } = data;
  
  return await prisma.$transaction(async (tx) => {
    let total = 0;
    const processedItems = [];

    // Validate items and calculate total
    for (const item of items) {
      const product = await tx.product.findUnique({ 
        where: { id: item.productId } 
      });
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      if (product.stockQuantity < item.qty) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const subtotal = item.qty * item.price;
      total += subtotal;
      
      processedItems.push({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        name: product.name,
        category: product.category
      });

      // Deduct stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.qty } }
      });
    }

    total -= discount;
    const billNo = await this.generateBillNo();

    // Get user info for soldBy field
    const user = await tx.user.findUnique({ where: { id: userId } });

    // Create sale
    const sale = await tx.sales.create({
      data: {
        ...rest,
        billNo,
        totalAmount: total,
        items: processedItems,
        userId,
        soldBy: user.username,
        purchaseDate: new Date()
      }
    });

    return sale;
  });
};

exports.listSales = async (filters = {}, pagination = {}) => {
  const { userId, startDate, endDate } = filters;
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const where = {};
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.purchaseDate = {};
    if (startDate) where.purchaseDate.gte = new Date(startDate);
    if (endDate) where.purchaseDate.lte = new Date(endDate);
  }

  const [sales, total] = await Promise.all([
    prisma.sales.findMany({
      where,
      skip,
      take: limit,
      orderBy: { purchaseDate: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        }
      }
    }),
    prisma.sales.count({ where })
  ]);

  return {
    sales,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.getSaleById = async (id) => {
  return prisma.sales.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, role: true }
      }
    }
  });
};