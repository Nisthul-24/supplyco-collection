import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Authenticate User
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Compute key stats (Lifting uploadedById restrictions for ADMINs)
    const filter: any = user.role === 'ADMIN' ? {} : { uploadedById: user.id };

    const totalDailyReportsCount = await prisma.dailyCollection.count({
      where: filter
    });
    const totalSalesReportsCount = await prisma.salesReport.count({
      where: filter
    });
    
    // Today's Date bounds (in our current context, let's look at the latest uploaded date, or fall back to system today)
    const latestDailyRecord = await prisma.dailyCollection.findFirst({
      where: filter,
      orderBy: { reportDate: 'desc' }
    });
    
    let todayCollection = 0;
    if (latestDailyRecord) {
      const startOfDay = new Date(latestDailyRecord.reportDate);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(latestDailyRecord.reportDate);
      endOfDay.setHours(23,59,59,999);
      
      const todayRecords = await prisma.dailyCollection.findMany({
        where: {
          ...filter,
          reportDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      todayCollection = todayRecords.reduce((sum, r) => sum + r.totalCollection, 0);
    }
    
    // 3. Daily Sales trends (last 30 reports)
    const dailyCollections = await prisma.dailyCollection.findMany({
      where: filter,
      orderBy: { reportDate: 'asc' },
      take: 30
    });
    
    const dailyTrends = dailyCollections.map(d => {
      const payDetails = JSON.parse(d.paymentDetails);
      return {
        date: d.reportDate.toISOString().split('T')[0],
        total: d.totalCollection,
        upi: payDetails.upi || 0,
        card: payDetails.creditCard || 0,
        cash: d.totalCollection - (payDetails.upi || 0) - (payDetails.creditCard || 0) - (payDetails.coupons || 0),
        outlet: d.outletName
      };
    });
    
    // 4. Monthly Trends (aggregated by reportMonth)
    const salesReports = await prisma.salesReport.findMany({
      where: filter,
      orderBy: { reportMonth: 'asc' }
    });
    
    // Group monthly sales by month
    const monthlyGroups: Record<string, { month: string; subsidy: number; nonSubsidy: number; bulk: number; total: number }> = {};
    salesReports.forEach(s => {
      if (!monthlyGroups[s.reportMonth]) {
        monthlyGroups[s.reportMonth] = {
          month: s.reportMonth,
          subsidy: 0,
          nonSubsidy: 0,
          bulk: 0,
          total: 0
        };
      }
      monthlyGroups[s.reportMonth].subsidy += s.subsidySales;
      monthlyGroups[s.reportMonth].nonSubsidy += s.nonSubsidySales;
      monthlyGroups[s.reportMonth].bulk += s.bulkSales;
      monthlyGroups[s.reportMonth].total += s.grandTotal;
    });
    const monthlyTrends = Object.values(monthlyGroups);
    
    // 5. Outlet Performance comparison (Top 10 outlets by total sales)
    const outletGroups: Record<string, { name: string; sales: number; collections: number }> = {};
    salesReports.forEach(s => {
      if (!outletGroups[s.outletName]) {
        outletGroups[s.outletName] = { name: s.outletName, sales: 0, collections: 0 };
      }
      outletGroups[s.outletName].sales += s.grandTotal;
    });
    
    // Sum daily collection to outlets as well
    dailyCollections.forEach(d => {
      if (!outletGroups[d.outletName]) {
        outletGroups[d.outletName] = { name: d.outletName, sales: 0, collections: 0 };
      }
      outletGroups[d.outletName].collections += d.totalCollection;
    });
    
    const outletTrends = Object.values(outletGroups)
      .sort((a, b) => b.sales - a.sales || b.collections - a.collections)
      .slice(0, 10);
      
    // 6. Payment method aggregate breakdown
    let totalUPI = 0;
    let totalCard = 0;
    let totalCoupon = 0;
    let totalCash = 0;
    
    dailyCollections.forEach(d => {
      const payDetails = JSON.parse(d.paymentDetails);
      totalUPI += payDetails.upi || 0;
      totalCard += payDetails.creditCard || 0;
      totalCoupon += payDetails.coupons || 0;
      const cashVal = d.totalCollection - (payDetails.upi || 0) - (payDetails.creditCard || 0) - (payDetails.coupons || 0);
      totalCash += cashVal > 0 ? cashVal : 0;
    });
    
    const paymentMethods = [
      { name: 'UPI', value: totalUPI },
      { name: 'Credit Card', value: totalCard },
      { name: 'Coupons', value: totalCoupon },
      { name: 'Cash', value: totalCash }
    ].filter(p => p.value > 0);
    
    // Overall totals across all history
    const grandTotalSalesAll = salesReports.reduce((sum, s) => sum + s.grandTotal, 0);
    const grandTotalCollectionAll = dailyCollections.reduce((sum, d) => sum + d.totalCollection, 0);

    return NextResponse.json({
      metrics: {
        totalDailyReports: totalDailyReportsCount,
        totalSalesReports: totalSalesReportsCount,
        latestDate: latestDailyRecord ? latestDailyRecord.reportDate.toISOString().split('T')[0] : null,
        todayCollection,
        totalSalesAllTime: grandTotalSalesAll,
        totalCollectionAllTime: grandTotalCollectionAll
      },
      dailyTrends,
      monthlyTrends,
      outletTrends,
      paymentMethods
    });
    
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
