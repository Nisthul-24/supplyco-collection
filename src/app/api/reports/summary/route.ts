import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

function getMonthsInRange(start: Date, end: Date): string[] {
  const months: string[] = [];
  const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastDate = new Date(end.getFullYear(), end.getMonth(), 1);
  
  while (currentDate <= lastDate) {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    months.push(`${yyyy}-${mm}`);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return months;
}

export async function GET(req: Request) {
  try {
    // 1. Authenticate User
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Parse Dates
    const url = new URL(req.url);
    const startDateStr = url.searchParams.get('startDate') || '';
    const endDateStr = url.searchParams.get('endDate') || '';
    
    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'startDate and endDate are required query parameters' }, { status: 400 });
    }
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999); // Full end day
    
    const filter: any = user.role === 'ADMIN' ? {} : { uploadedById: user.id };

    // 3. Fetch Daily Collections
    const dailyCollections = await prisma.dailyCollection.findMany({
      where: {
        ...filter,
        reportDate: {
          gte: start,
          lte: end
        }
      },
      orderBy: { reportDate: 'asc' }
    });
    
    // Aggregate Daily Collections
    let totalCollectionSum = 0;
    const dailyBreakdown = {
      maveliSubsidy: 0,
      maveliFssr: 0,
      maveliSabariBp: 0,
      maveliSabariTea: 0,
      sabariCoOil: 0,
      maveliOthers: 0,
      nonMaveli: 0,
      medical: 0,
      nonMedical: 0,
      petrolDiesel: 0,
      lpg: 0,
      others: 0,
      roundOff: 0,
      discounts: 0,
      retailCollection: 0,
      bulkCollection: 0,
      creditCard: 0,
      upi: 0,
      coupons: 0,
      amountToRemit: 0,
    };
    
    const dailyReportsList = dailyCollections.map(r => {
      totalCollectionSum += r.totalCollection;
      const details = JSON.parse(r.paymentDetails);
      
      // Sum up breakdowns
      for (const key in dailyBreakdown) {
        if (Object.prototype.hasOwnProperty.call(dailyBreakdown, key) && typeof details[key] === 'number') {
          (dailyBreakdown as any)[key] += details[key];
        }
      }
      
      return {
        id: r.id,
        reportDate: r.reportDate,
        outletName: r.outletName,
        totalCollection: r.totalCollection,
        fileName: r.fileName,
        uploadedFileUrl: r.uploadedFileUrl
      };
    });
    
    // 4. Fetch Monthly Sales Reports for the months covered by date range
    const months = getMonthsInRange(start, end);
    const salesReports = await prisma.salesReport.findMany({
      where: {
        ...filter,
        reportMonth: {
          in: months
        }
      },
      orderBy: { reportMonth: 'asc' }
    });
    
    // Aggregate Sales Reports
    let subsidySalesSum = 0;
    let nonSubsidySalesSum = 0;
    let bulkSalesSum = 0;
    let grandTotalSum = 0;
    
    const salesBreakdown = {
      subsidyMaveli: 0,
      subsidyCocOil: 0,
      sabariSales: 0,
      others: 0,
      fssr: 0,
      bulkMaveli: 0,
      bulkSabari: 0,
      bulkNM: 0,
      nonMaveliSales: 0,
      cbValueNonMaveli: 0,
      overageNonMaveli: 0,
      totalWithoutBulk: 0,
    };
    
    const salesReportsList = salesReports.map(r => {
      subsidySalesSum += r.subsidySales;
      nonSubsidySalesSum += r.nonSubsidySales;
      bulkSalesSum += r.bulkSales;
      grandTotalSum += r.grandTotal;
      
      const extra = JSON.parse(r.extraDetails);
      
      // Sum up subcolumns
      for (const key in salesBreakdown) {
        if (Object.prototype.hasOwnProperty.call(salesBreakdown, key) && typeof extra[key] === 'number') {
          (salesBreakdown as any)[key] += extra[key];
        }
      }
      
      return {
        id: r.id,
        reportMonth: r.reportMonth,
        outletName: r.outletName,
        subsidySales: r.subsidySales,
        nonSubsidySales: r.nonSubsidySales,
        grandTotal: r.grandTotal,
        fileName: r.fileName,
        uploadedFileUrl: r.uploadedFileUrl
      };
    });
    
    // 5. Send aggregated response
    return NextResponse.json({
      meta: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        daysChecked: dailyCollections.length,
        monthsChecked: months
      },
      collections: {
        total: totalCollectionSum,
        breakdown: dailyBreakdown,
        reports: dailyReportsList
      },
      sales: {
        subsidySalesTotal: subsidySalesSum,
        nonSubsidySalesTotal: nonSubsidySalesSum,
        bulkSalesTotal: bulkSalesSum,
        grandTotal: grandTotalSum,
        breakdown: salesBreakdown,
        reports: salesReportsList
      }
    });
    
  } catch (error: any) {
    console.error('Summary API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
