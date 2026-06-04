const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding with user relationships...');

  // 1. Create Default Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: {
      name: 'Adithya Varma (Admin)',
      email: 'admin@shop.com',
      role: 'ADMIN',
      password: adminPassword
    }
  });
  console.log('Seeded Admin Account:', admin.email, 'ID:', admin.id);

  const staff = await prisma.user.upsert({
    where: { email: 'staff@shop.com' },
    update: {},
    create: {
      name: 'Nisha Nair (Staff)',
      email: 'staff@shop.com',
      role: 'STAFF',
      password: staffPassword
    }
  });
  console.log('Seeded Staff Account:', staff.email, 'ID:', staff.id);

  // 2. Seed Mock Daily Collection Reports (MUKKAM SUPER MARKET) - Associated with ADMIN
  const outletName = 'MUKKAM SUPER MARKET';
  const mockCollections = [
    {
      date: new Date('2026-05-20'),
      total: 105820.00,
      upi: 32450.00,
      card: 12000.00,
      remit: 61370.00,
      subsidy: 46200.00,
      fssr: 16500.00,
      bp: 3200.00,
      tea: 1950.00,
      oil: 9800.00,
      others: 28170.00,
      discount: 120.00,
      hash: 'mock-daily-hash-20'
    },
    {
      date: new Date('2026-05-21'),
      total: 112450.00,
      upi: 38200.00,
      card: 15000.00,
      remit: 59250.00,
      subsidy: 49500.00,
      fssr: 17200.00,
      bp: 3600.00,
      tea: 2100.00,
      oil: 10400.00,
      others: 29650.00,
      discount: 150.00,
      hash: 'mock-daily-hash-21'
    },
    {
      date: new Date('2026-05-22'),
      total: 98400.00,
      upi: 29400.00,
      card: 8000.00,
      remit: 61000.00,
      subsidy: 42100.00,
      fssr: 15400.00,
      bp: 2900.00,
      tea: 1800.00,
      oil: 8900.00,
      others: 27300.00,
      discount: 80.00,
      hash: 'mock-daily-hash-22'
    },
    {
      date: new Date('2026-05-23'),
      total: 111319.00,
      upi: 34573.00,
      card: 0.00,
      remit: 76443.00,
      subsidy: 48581.96,
      fssr: 17514.39,
      bp: 3815.81,
      tea: 2239.83,
      oil: 11029.82,
      others: 28131.85,
      discount: 0.00,
      hash: 'mock-daily-hash-23'
    },
    {
      date: new Date('2026-05-24'),
      total: 121500.00,
      upi: 41200.00,
      card: 18000.00,
      remit: 62300.00,
      subsidy: 53100.00,
      fssr: 19400.00,
      bp: 4100.00,
      tea: 2400.00,
      oil: 12200.00,
      others: 30300.00,
      discount: 220.00,
      hash: 'mock-daily-hash-24'
    }
  ];

  for (const item of mockCollections) {
    const paymentDetails = {
      maveliSubsidy: item.subsidy,
      maveliFssr: item.fssr,
      maveliSabariBp: item.bp,
      maveliSabariTea: item.tea,
      sabariCoOil: item.oil,
      maveliOthers: 1.28,
      nonMaveli: item.others,
      medical: 0,
      nonMedical: 0,
      petrolDiesel: 0,
      lpg: 0,
      others: 0,
      roundOff: 5.34,
      discounts: item.discount,
      retailCollection: item.total,
      bulkCollection: 0,
      creditCard: item.card,
      upi: item.upi,
      coupons: item.total - item.card - item.upi - item.remit > 0 ? 303 : 0,
      amountToRemit: item.remit
    };

    await prisma.dailyCollection.upsert({
      where: { fileHash: item.hash },
      update: { uploadedById: admin.id },
      create: {
        reportDate: item.date,
        outletName: outletName,
        totalCollection: item.total,
        paymentDetails: JSON.stringify(paymentDetails),
        rawTextData: `Outlet: ${outletName}, Date: ${item.date.toISOString()}, Total: ${item.total}`,
        uploadedFileUrl: '/uploads/sample-daily.xlsx',
        fileName: 'sample_daily_report.xlsx',
        fileHash: item.hash,
        uploadedById: admin.id
      }
    });
  }
  console.log('Seeded Daily Collection History for outlet:', outletName, 'assigned to ADMIN');

  // 3. Seed Mock Monthly Sales Reports (SSM MUKKAM) - Associated with STAFF
  const salesOutlet = 'SSM MUKKAM';
  const mockSales = [
    {
      month: '2026-04',
      subsidyMaveli: 1263447.74,
      subsidyCocOil: 148800.00,
      sabariSales: 435825.26,
      others: -53.00,
      fssr: 307704.42,
      nonMaveliSales: 849395.40,
      grandTotal: 3005120.00,
      cbValue: 868033.00,
      overage: 290135.00,
      hash: 'mock-sales-hash-04'
    },
    {
      month: '2026-05',
      subsidyMaveli: 1312400.00,
      subsidyCocOil: 154200.00,
      sabariSales: 452100.00,
      others: 0,
      fssr: 318400.00,
      nonMaveliSales: 885600.00,
      grandTotal: 3122700.00,
      cbValue: 894300.00,
      overage: 298500.00,
      hash: 'mock-sales-hash-05'
    }
  ];

  for (const s of mockSales) {
    const totalSubsidySales = s.subsidyMaveli + s.subsidyCocOil;
    const totalNonSubsidySales = s.sabariSales + s.others + s.fssr + s.nonMaveliSales;
    const extraDetails = {
      subsidyMaveli: s.subsidyMaveli,
      subsidyCocOil: s.subsidyCocOil,
      sabariSales: s.sabariSales,
      others: s.others,
      fssr: s.fssr,
      bulkMaveli: 0,
      bulkSabari: 0,
      bulkNM: 0,
      nonMaveliSales: s.nonMaveliSales,
      cbValueNonMaveli: s.cbValue,
      overageNonMaveli: s.overage,
      totalWithoutBulk: s.grandTotal
    };

    const existingReport = await prisma.salesReport.findFirst({
      where: { fileHash: s.hash }
    });

    if (existingReport) {
      await prisma.salesReport.update({
        where: { id: existingReport.id },
        data: { uploadedById: staff.id }
      });
    } else {
      await prisma.salesReport.create({
        data: {
          reportMonth: s.month,
          outletName: salesOutlet,
          subsidySales: totalSubsidySales,
          nonSubsidySales: totalNonSubsidySales,
          bulkSales: 0,
          grandTotal: s.grandTotal,
          extraDetails: JSON.stringify(extraDetails),
          uploadedFileUrl: '/uploads/sample-sales.xlsx',
          fileName: 'sample_monthly_sales.xlsx',
          fileHash: s.hash,
          uploadedById: staff.id
        }
      });
    }
  }
  console.log('Seeded Monthly Sales History for outlet:', salesOutlet, 'assigned to STAFF');

  console.log('Database seeding successfully finished!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
