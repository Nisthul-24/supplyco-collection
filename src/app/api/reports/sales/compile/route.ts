import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    // 1. Authenticate User
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse range (either month YYYY-MM or startDate + endDate)
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let start: Date;
    let end: Date;
    let titleRange = '';

    if (startDateParam && endDateParam) {
      start = new Date(startDateParam);
      end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      titleRange = `FROM ${startDateParam} TO ${endDateParam}`;
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr);
      const monthIndex = parseInt(monthStr) - 1; // 0-indexed month

      start = new Date(year, monthIndex, 1);
      end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999); // last day of month
      
      const monthsNames = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
      ];
      titleRange = `FOR THE MONTH ${monthsNames[monthIndex]} - ${yearStr}`;
    } else {
      return NextResponse.json({ error: 'Either month or both startDate and endDate parameters are required' }, { status: 400 });
    }

    const filter: any = user.role === 'ADMIN' ? {} : { uploadedById: user.id };

    // 3. Fetch Daily Collections in this date range
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

    // 4. Compile into Monthly Sales Report groupings (grouped by outletName)
    const grouped = dailyCollections.reduce((acc, col) => {
      const name = col.outletName.toUpperCase().trim();
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(col);
      return acc;
    }, {} as Record<string, typeof dailyCollections>);

    const compiledReports = [];

    for (const outletName in grouped) {
      const cols = grouped[outletName];
      
      let subsidyMaveli = 0;
      let subsidyCocOil = 0;
      let sabariSales = 0;
      let others = 0;
      let fssr = 0;
      let bulkMaveli = 0;
      let bulkSabari = 0;
      let bulkNM = 0;
      let nonMaveliSales = 0;

      cols.forEach(col => {
        let details: any = {};
        try {
          details = JSON.parse(col.paymentDetails);
        } catch (e) {
          console.error('Error parsing paymentDetails JSON:', e);
        }
        
        subsidyMaveli += (details.maveliSubsidy || 0) + (details.maveliOthers || 0);
        subsidyCocOil += (details.sabariCoOil || 0);
        
        // Sabari non-oil is represented by BP and Tea in daily collection sheet
        sabariSales += (details.maveliSabariBp || 0) + (details.maveliSabariTea || 0);
        
        // Sum up other miscellaneous daily sales
        others += (details.others || 0) + (details.medical || 0) + (details.nonMedical || 0) + (details.petrolDiesel || 0) + (details.lpg || 0) + (details.roundOff || 0) - (details.discounts || 0);
        
        fssr += (details.maveliFssr || 0);
        bulkMaveli += (details.bulkCollection || 0);
        nonMaveliSales += (details.nonMaveli || 0);
      });

      const totalSubsidySales = subsidyMaveli + subsidyCocOil;
      const totalNonSubsidySales = sabariSales + others + fssr + bulkMaveli + bulkSabari + bulkNM + nonMaveliSales;
      const grandTotal = totalSubsidySales + totalNonSubsidySales;
      const totalWithoutBulk = totalSubsidySales + sabariSales + others + fssr + nonMaveliSales;

      compiledReports.push({
        outletName,
        reportMonth: month,
        subsidySales: totalSubsidySales,
        nonSubsidySales: totalNonSubsidySales,
        bulkSales: bulkMaveli + bulkSabari + bulkNM,
        grandTotal,
        extraDetails: {
          subsidyMaveli,
          subsidyCocOil,
          sabariSales,
          others,
          fssr,
          bulkMaveli,
          bulkSabari,
          bulkNM,
          nonMaveliSales,
          cbValueNonMaveli: 0,
          overageNonMaveli: 0,
          totalWithoutBulk
        }
      });
    }

    return NextResponse.json({
      meta: {
        month,
        titleRange,
        daysCount: dailyCollections.length,
        outletsCount: compiledReports.length
      },
      reports: compiledReports
    });

  } catch (error: any) {
    console.error('Compile Monthly Sales API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
