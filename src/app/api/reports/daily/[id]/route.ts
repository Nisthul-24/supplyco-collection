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
    const record = await prisma.dailyCollection.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Daily collection report not found' }, { status: 404 });
    }
    
    // 3. Verify Ownership
    if (record.uploadedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You can only delete reports you uploaded.' }, { status: 403 });
    }
    
    // 4. Delete Record
    await prisma.dailyCollection.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Daily collection report deleted successfully' });
    
  } catch (error) {
    console.error('Delete daily report error:', error);
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
    const record = await prisma.dailyCollection.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Daily collection report not found' }, { status: 404 });
    }
    
    // 3. Verify Ownership
    if (record.uploadedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You can only edit reports you uploaded.' }, { status: 403 });
    }
    
    // 4. Parse request body
    const body = await req.json();
    const { outletName, reportDate, totalCollection, paymentDetails } = body;
    
    if (!outletName || !reportDate || totalCollection === undefined || !paymentDetails) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Auto-recalculate Remittance if UPI/Card/Cash was updated
    const upi = parseFloat(paymentDetails.upi) || 0;
    const card = parseFloat(paymentDetails.creditCard) || 0;
    const coupons = parseFloat(paymentDetails.coupons) || 0;
    const total = parseFloat(totalCollection) || 0;
    
    const recalculatedRemit = total - upi - card - coupons;
    const finalPaymentDetails = {
      ...paymentDetails,
      upi,
      creditCard: card,
      coupons,
      amountToRemit: recalculatedRemit > 0 ? recalculatedRemit : 0
    };
    
    // 5. Update Database Record
    const updated = await prisma.dailyCollection.update({
      where: { id },
      data: {
        outletName: outletName.trim(),
        reportDate: new Date(reportDate),
        totalCollection: total,
        paymentDetails: JSON.stringify(finalPaymentDetails)
      }
    });
    
    return NextResponse.json({
      message: 'Daily collection report updated successfully',
      report: {
        ...updated,
        paymentDetails: finalPaymentDetails
      }
    });
    
  } catch (error) {
    console.error('Update daily report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
