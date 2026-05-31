import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Check password
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Sign token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    
    // Set HTTP-only Cookie
    await setAuthCookie(token);
    
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
