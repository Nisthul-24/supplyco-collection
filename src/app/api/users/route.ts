import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Authenticate Requesting User
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Authorize Admin
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. User management is restricted to administrators.' }, { status: 403 });
    }
    
    // 3. Fetch Users (excluding passwords for security)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate Requesting User
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Authorize Admin
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. User registration is restricted to administrators.' }, { status: 403 });
    }
    
    // 3. Parse and Validate
    const body = await req.json();
    const { name, email, password, role } = body;
    
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required fields' }, { status: 400 });
    }
    
    // Check duplicates
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Email is already registered in the system' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      message: 'Account created successfully',
      user: newUser
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
