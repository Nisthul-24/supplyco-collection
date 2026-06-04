const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in database:', users);
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
