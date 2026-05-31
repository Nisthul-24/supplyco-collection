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
    
    // 2. Parse Query Parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const outlet = url.searchParams.get('outlet') || '';
    const startDateStr = url.searchParams.get('startDate') || '';
    const endDateStr = url.searchParams.get('endDate') || '';
    const sortBy = url.searchParams.get('sortBy') || 'reportDate';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    // 3. Build Prisma Query Where Object
    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.uploadedById = user.id;
    }
    
    if (outlet) {
      where.outletName = {
        contains: outlet
      };
    }
    
    if (startDateStr || endDateStr) {
      where.reportDate = {};
      if (startDateStr) {
        where.reportDate.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        // Set end date to end of that day (23:59:59) to include all records on that date
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);
        where.reportDate.lte = endDate;
      }
    }
    
    // 4. Query DB
    const [reports, totalCount] = await Promise.all([
      prisma.dailyCollection.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.dailyCollection.count({ where })
    ]);
    
    // Convert paymentDetails JSON strings back to objects
    const parsedReports = reports.map(r => ({
      ...r,
      paymentDetails: JSON.parse(r.paymentDetails)
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      reports: parsedReports,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
    
  } catch (error: any) {
    console.error('Fetch daily reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
