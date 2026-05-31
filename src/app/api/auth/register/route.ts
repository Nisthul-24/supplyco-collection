import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }
    
    // Check if this is the first user in the database
    const userCount = await prisma.user.count();
    
    // First user is Admin. Otherwise, use requested role (or default to STAFF)
    const assignedRole = userCount === 0 ? 'ADMIN' : (role || 'STAFF');
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: assignedRole
      }
    });
    
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
