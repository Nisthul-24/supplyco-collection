import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '10') || 10;
    
    // Build query conditions
    const where: any = {
      recordedById: user.id
    };

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        where.expenseDate.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { customCategory: { contains: search } }
      ];
    }

    // Execute queries
    const offset = (page - 1) * limit;
    const [expenses, totalCount] = await Promise.all([
      prisma.dailyExpense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.dailyExpense.count({ where })
    ]);

    // Also get all-time stats for the user to display on top
    const userStats = await prisma.dailyExpense.aggregate({
      where: { recordedById: user.id },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Let's get today's total expenses for this user
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayStats = await prisma.dailyExpense.aggregate({
      where: {
        recordedById: user.id,
        expenseDate: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      _sum: { amount: true }
    });

    // Get active filter sum
    const activeFilterStats = await prisma.dailyExpense.aggregate({
      where,
      _sum: { amount: true }
    });

    // Let's also find the most expensive category for the user
    const categoriesGroup = await prisma.dailyExpense.groupBy({
      by: ['category'],
      where: { recordedById: user.id },
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 1
    });
    
    const topCategory = categoriesGroup.length > 0 ? categoriesGroup[0].category : 'N/A';

    return NextResponse.json({
      expenses,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalAllTime: userStats._sum.amount || 0,
        countAllTime: userStats._count.id || 0,
        totalToday: todayStats._sum.amount || 0,
        totalFiltered: activeFilterStats._sum.amount || 0,
        topCategory
      }
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Create the expense
    const newExpense = await prisma.dailyExpense.create({
      data: {
        expenseDate: new Date(expenseDate),
        category,
        customCategory: category === 'Others' ? customCategory.trim() : null,
        amount: numericAmount,
        description: description ? description.trim() : null,
        recordedById: user.id
      }
    });

    return NextResponse.json({
      message: 'Expense recorded successfully',
      expense: newExpense
    }, { status: 201 });

  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
