const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Delete non-mock sales reports
    const deleted = await prisma.salesReport.deleteMany({
      where: {
        NOT: {
          fileHash: {
            in: ['mock-sales-hash-04', 'mock-sales-hash-05']
          }
        }
      }
    });
    console.log('Deleted non-mock sales reports count:', deleted.count);
  } catch (err) {
    console.error('Error deleting sales reports:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
