const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const result = await prisma.$queryRaw`
      SELECT count(*), state 
      FROM pg_stat_activity 
      GROUP BY state;
    `;
    console.log('Active connections group by state:');
    console.log(result);

    const details = await prisma.$queryRaw`
      SELECT pid, usename, client_addr, backend_start, query, state 
      FROM pg_stat_activity 
      LIMIT 10;
    `;
    console.log('Top 10 connection details:');
    console.log(details);
  } catch (error) {
    console.error('Failed to fetch connection stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
