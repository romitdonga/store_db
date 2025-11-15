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
        customerPhone: String(rest.customerPhone).replace(/\D+/g, ""),
        customerName: String(rest.customerName).trim(),
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

const phoneCache = new Map();
const PHONE_PREFIX_MIN_LENGTH = 3;
const MAX_CACHE_ENTRIES = 200;
const CACHE_TTL_MS = 60_000;

function getCacheEntry(key) {
  const entry = phoneCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > CACHE_TTL_MS) {
    phoneCache.delete(key);
    return null;
  }
  return entry.v;
}

function setCacheEntry(key, value) {
  if (phoneCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = phoneCache.keys().next().value;
    if (firstKey) phoneCache.delete(firstKey);
  }
  phoneCache.set(key, { v: value, t: Date.now() });
}

exports.searchCustomersByPhonePrefix = async (prefix, limit = 10) => {
  const normalized = String(prefix).replace(/\D+/g, "");
  if (!normalized || normalized.length < PHONE_PREFIX_MIN_LENGTH) return [];
  const cacheKey = `${normalized}:${limit}`;
  const cached = getCacheEntry(cacheKey);
  if (cached) return cached;

  function nextPrefix(s) {
    // increment decimal string: '987' -> '988', '999' -> '1000'
    let carry = 1;
    const arr = s.split("");
    for (let i = arr.length - 1; i >= 0; i--) {
      let d = arr[i].charCodeAt(0) - 48 + carry;
      if (d >= 10) {
        arr[i] = "0";
        carry = 1;
      } else {
        arr[i] = String.fromCharCode(48 + d);
        carry = 0;
        break;
      }
    }
    return carry === 1 ? "1" + arr.join("") : arr.join("");
  }

  const upper = nextPrefix(normalized);

  const rows = await prisma.sales.findMany({
    where: { customerPhone: { gte: normalized, lt: upper } },
    select: { customerPhone: true, customerName: true },
    distinct: ["customerPhone"],
    orderBy: { customerPhone: "asc" },
    take: limit
  });

  setCacheEntry(cacheKey, rows);
  return rows;
};