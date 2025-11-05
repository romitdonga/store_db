const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { 
      username: 'admin', 
      passwordHash: hashed, 
      role: 'OWNER',
      email: 'admin@store.com',
      phone: '+1234567890'
    }
  });
  console.log('Seeded owner user');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });