import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    // 1. Authenticate User
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Fetch Record
    const record = await prisma.salesReport.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Sales report not found' }, { status: 404 });
    }
    
    // 3. Verify Ownership
    if (record.uploadedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You can only delete reports you uploaded.' }, { status: 403 });
    }
    
    // 4. Delete Record
    await prisma.salesReport.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Sales report deleted successfully' });
    
  } catch (error) {
    console.error('Delete sales report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    // 1. Authenticate User
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Fetch Record
    const record = await prisma.salesReport.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Sales report not found' }, { status: 404 });
    }
    
    // 3. Verify Ownership
    if (record.uploadedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You can only edit reports you uploaded.' }, { status: 403 });
    }
    
    // 4. Parse request body
    const body = await req.json();
    const { outletName, reportMonth, subsidySales, nonSubsidySales, bulkSales, grandTotal, extraDetails } = body;
    
    if (!outletName || !reportMonth || subsidySales === undefined || nonSubsidySales === undefined || grandTotal === undefined || !extraDetails) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // 5. Update Database Record
    const updated = await prisma.salesReport.update({
      where: { id },
      data: {
        outletName: outletName.trim(),
        reportMonth: reportMonth.trim(),
        subsidySales: parseFloat(subsidySales) || 0,
        nonSubsidySales: parseFloat(nonSubsidySales) || 0,
        bulkSales: parseFloat(bulkSales) || 0,
        grandTotal: parseFloat(grandTotal) || 0,
        extraDetails: JSON.stringify(extraDetails)
      }
    });
    
    return NextResponse.json({
      message: 'Sales report updated successfully',
      report: {
        ...updated,
        extraDetails
      }
    });
    
  } catch (error) {
    console.error('Update sales report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
