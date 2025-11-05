const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [
    totalProducts,
    lowStockProducts,
    totalSales,
    todaySales,
    monthSales,
    lastMonthSales,
    totalUsers,
    recentSales
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stockQuantity: { lte: 10 } } }),
    prisma.sales.count(),
    prisma.sales.aggregate({
      where: { purchaseDate: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true
    }),
    prisma.sales.aggregate({
      where: { purchaseDate: { gte: thisMonth } },
      _sum: { totalAmount: true },
      _count: true
    }),
    prisma.sales.aggregate({
      where: { 
        purchaseDate: { 
          gte: lastMonth, 
          lt: thisMonth 
        } 
      },
      _sum: { totalAmount: true },
      _count: true
    }),
    prisma.user.count(),
    prisma.sales.findMany({
      take: 10,
      orderBy: { purchaseDate: 'desc' },
      select: {
        id: true,
        billNo: true,
        customerName: true,
        totalAmount: true,
        purchaseDate: true,
        status: true,
        soldBy: true
      }
    })
  ]);

  const monthlyGrowth = lastMonthSales._sum.totalAmount 
    ? ((monthSales._sum.totalAmount - lastMonthSales._sum.totalAmount) / lastMonthSales._sum.totalAmount * 100).toFixed(1)
    : 0;

  return {
    stats: {
      totalProducts,
      lowStockProducts,
      totalSales,
      todayRevenue: todaySales._sum.totalAmount || 0,
      todaySales: todaySales._count,
      monthlyRevenue: monthSales._sum.totalAmount || 0,
      monthlySales: monthSales._count,
      monthlyGrowth,
      totalUsers
    },
    recentSales
  };
};

exports.getSalesReport = async (startDate, endDate, groupBy = 'day') => {
  const where = {};
  if (startDate) where.purchaseDate = { gte: new Date(startDate) };
  if (endDate) {
    where.purchaseDate = where.purchaseDate || {};
    where.purchaseDate.lte = new Date(endDate);
  }

  const sales = await prisma.sales.findMany({
    where,
    orderBy: { purchaseDate: 'asc' },
    select: {
      purchaseDate: true,
      totalAmount: true,
      items: true,
      status: true,
      soldBy: true
    }
  });

  // Group sales by specified period
  const grouped = {};
  sales.forEach(sale => {
    const date = new Date(sale.purchaseDate);
    let key;
    
    switch (groupBy) {
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = { date: key, totalAmount: 0, count: 0, items: [] };
    }
    
    grouped[key].totalAmount += sale.totalAmount;
    grouped[key].count += 1;
    grouped[key].items.push(...sale.items);
  });

  return Object.values(grouped);
};

exports.getTopProducts = async (limit = 10, startDate, endDate) => {
  const where = {};
  if (startDate || endDate) {
    where.purchaseDate = {};
    if (startDate) where.purchaseDate.gte = new Date(startDate);
    if (endDate) where.purchaseDate.lte = new Date(endDate);
  }

  const sales = await prisma.sales.findMany({
    where,
    select: { items: true }
  });

  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.name,
          category: item.category,
          totalQuantity: 0,
          totalRevenue: 0
        };
      }
      productSales[item.productId].totalQuantity += item.qty;
      productSales[item.productId].totalRevenue += (item.qty * item.price);
    });
  });

  return Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
};

exports.getLowStockProducts = async (threshold = 10) => {
  return prisma.product.findMany({
    where: { stockQuantity: { lte: threshold } },
    orderBy: { stockQuantity: 'asc' },
    select: {
      id: true,
      name: true,
      category: true,
      stockQuantity: true,
      price: true
    }
  });
};