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
    const record = await prisma.dailyExpense.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Expense record not found' }, { status: 404 });
    }
    
    // 3. Verify Ownership
    if (record.recordedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You can only delete expenses you recorded.' }, { status: 403 });
    }
    
    // 4. Delete Record
    await prisma.dailyExpense.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Expense record deleted successfully' });
    
  } catch (error) {
    console.error('Delete expense error:', error);
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
    const record = await prisma.dailyExpense.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Expense record not found' }, { status: 404 });
    }
    
    // 3. Verify Ownership
    if (record.recordedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You can only edit expenses you recorded.' }, { status: 403 });
    }
    
    // 4. Parse request body
    const body = await req.json();
    const { expenseDate, category, customCategory, amount, description } = body;
    
    if (!expenseDate || !category || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Missing required parameters (expenseDate, category, amount)' }, { status: 400 });
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    if (category === 'Others' && !customCategory) {
      return NextResponse.json({ error: 'Custom category is required when selecting Others' }, { status: 400 });
    }
    
    // 5. Update Database Record
    const updated = await prisma.dailyExpense.update({
      where: { id },
      data: {
        expenseDate: new Date(expenseDate),
        category,
        customCategory: category === 'Others' ? customCategory.trim() : null,
        amount: numericAmount,
        description: description ? description.trim() : null
      }
    });
    
    return NextResponse.json({
      message: 'Expense record updated successfully',
      expense: updated
    });
    
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
