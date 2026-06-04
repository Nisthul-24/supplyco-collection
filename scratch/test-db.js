const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Attempting to query database...');
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Successfully connected! Users count:', users.length);
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
