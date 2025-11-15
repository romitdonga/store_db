// seed-full.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

const categories = ['SHIRT', 'PANT', 'TSHIRT', 'SHORTS', 'BLAZER', 'JEANS', 'KURTA'];
const saleStatuses = ['PAID', 'PENDING'];
const paymentMethods = ['CASH', 'UPI', 'CARD'];

const yearCounters = new Map();
function generateBillNoForYear(year) {
    const count = yearCounters.get(year) || 0;
    const bill = `BILL-${year}-${String(count + 1).padStart(3, '0')}`;
    yearCounters.set(year, count + 1);
    return bill;
}

// --- Random date between two ---
function randomDate(start, end) {
    return faker.date.between({ from: start, to: end });
}

// --- Generate realistic products ---
function generateProduct(category) {
    const productNames = {
        SHIRT: ['Cotton Shirt', 'Formal Shirt', 'Casual Check Shirt', 'Linen Shirt', 'Denim Shirt', 'Flannel Shirt', 'Striped Shirt'],
        PANT: ['Formal Pant', 'Jeans Pant', 'Cargo Pant', 'Chino Pant', 'Jogger Pant', 'Corduroy Pant', 'Slim Fit Pant'],
        TSHIRT: ['Graphic T-Shirt', 'Plain T-Shirt', 'Polo T-Shirt', 'Round Neck T-Shirt', 'V-Neck T-Shirt', 'Sleeveless T-Shirt', 'Long Sleeve T-Shirt'],
        SHORTS: ['Denim Shorts', 'Sports Shorts', 'Cotton Shorts', 'Chino Shorts', 'Bermuda Shorts', 'Cargo Shorts'],
        BLAZER: ['Casual Blazer', 'Formal Blazer', 'Wedding Blazer', 'Velvet Blazer', 'Double Breasted Blazer', 'Linen Blazer'],
        JEANS: ['Slim Fit Jeans', 'Regular Fit Jeans', 'Distressed Jeans', 'Bootcut Jeans', 'Skinny Jeans', 'High Waist Jeans'],
        KURTA: ['Cotton Kurta', 'Designer Kurta', 'Plain Kurta', 'Silk Kurta', 'Embroidered Kurta', 'Festive Kurta'],
    };

    const name = faker.helpers.arrayElement(productNames[category]);
    const costPrice = faker.number.float({ min: 300, max: 1200, multipleOf: 10 });
    const sellPrice = costPrice + faker.number.float({ min: 100, max: 600, multipleOf: 10 });
    const stockQuantity = faker.number.int({ min: 5, max: 100 });

    return {
        name,
        category,
        stockQuantity,
        minStockAlert: faker.number.int({ min: 3, max: 10 }),
        costPrice,
        sellPrice,
        supplier: faker.company.name(),
        createdAt: randomDate('2024-01-01', '2025-11-01'),
    };
}

// --- Generate fake sale items ---
function generateSaleItems(products) {
    const count = faker.number.int({ min: 1, max: 5 });
    const selected = faker.helpers.arrayElements(products, count);
    let total = 0;
    const items = selected.map((p) => {
        const qty = faker.number.int({ min: 1, max: 4 });
        const price = p.sellPrice;
        total += qty * price;
        return { productId: p.id, qty, price };
    });
    return { items, total };
}

// --- Main Seeder ---
async function main() {
    console.log('🌱 Starting full database seeding...');

    // Create Employees
    const employees = [];
    for (let i = 1; i <= 3; i++) {
        const hashed = await bcrypt.hash(`employee${i}123`, 10);
        const employee = await prisma.user.create({
            data: {
                username: `employee${i}`,
                email: `employee${i}@store.com`,
                phone: genIndianPhone(),
                passwordHash: hashed,
                role: 'EMPLOYEE',
            },
        });
        employees.push(employee);
    }

    // Create Products
    const products = [];
    for (const category of categories) {
        for (let i = 0; i < 6; i++) {
            const p = await prisma.product.create({
                data: generateProduct(category),
            });
            products.push(p);
        }
    }
    console.log(`🧺 Created ${products.length} products.`);

    // Create Sales (200+)
    const users = await prisma.user.findMany();
    for (let i = 0; i < 220; i++) {
        const { items, total } = generateSaleItems(products);
        const user = faker.helpers.arrayElement(users);
        const discount = faker.number.int({ min: 0, max: 10 });
        const totalAfterDiscount = total - (total * discount) / 100;
        const purchaseDate = randomDate('2024-01-01', '2025-11-01');
        const billNo = generateBillNoForYear(purchaseDate.getFullYear());
        await prisma.sales.create({
            data: {
                billNo,
                customerName: faker.person.fullName(),
                customerPhone: genIndianPhone(),
                totalAmount: totalAfterDiscount,
                items,
                status: faker.helpers.arrayElement(saleStatuses),
                paymentMethod: faker.helpers.arrayElement(paymentMethods),
                purchaseDate,
                discount,
                userId: user.id,
                soldBy: user.username,
            },
        });
    }

    for (let i = 0; i < 25; i++) {
        const { items, total } = generateSaleItems(products);
        const user = faker.helpers.arrayElement(users);
        const discount = faker.number.int({ min: 0, max: 10 });
        const totalAfterDiscount = total - (total * discount) / 100;
        const purchaseDate = randomDate('2024-01-01', '2025-11-01');
        const billNo = generateBillNoForYear(purchaseDate.getFullYear());
        await prisma.sales.create({
            data: {
                billNo,
                customerName: faker.person.fullName(),
                customerPhone: genIndianPhone('980'),
                totalAmount: totalAfterDiscount,
                items,
                status: faker.helpers.arrayElement(saleStatuses),
                paymentMethod: faker.helpers.arrayElement(paymentMethods),
                purchaseDate,
                discount,
                userId: user.id,
                soldBy: user.username,
            },
        });
    }

    for (let i = 0; i < 25; i++) {
        const { items, total } = generateSaleItems(products);
        const user = faker.helpers.arrayElement(users);
        const discount = faker.number.int({ min: 0, max: 10 });
        const totalAfterDiscount = total - (total * discount) / 100;
        const purchaseDate = randomDate('2024-01-01', '2025-11-01');
        const billNo = generateBillNoForYear(purchaseDate.getFullYear());
        await prisma.sales.create({
            data: {
                billNo,
                customerName: faker.person.fullName(),
                customerPhone: genIndianPhone('987'),
                totalAmount: totalAfterDiscount,
                items,
                status: faker.helpers.arrayElement(saleStatuses),
                paymentMethod: faker.helpers.arrayElement(paymentMethods),
                purchaseDate,
                discount,
                userId: user.id,
                soldBy: user.username,
            },
        });
    }

    console.log('✅ Seeded 3 employees, 40 products, and 270+ sales.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
function genIndianPhone(prefix) {
    let base = prefix || String(faker.number.int({ min: 6, max: 9 }));
    while (base.length < 10) {
        base += String(faker.number.int({ min: 0, max: 9 }));
    }
    return base.slice(0, 10);
}
