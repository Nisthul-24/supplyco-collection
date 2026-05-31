import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function HomePage() {
  const user = await getAuthenticatedUser();
  
  // If the user session is already active, redirect immediately to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050811]">
      {/* Cybernetic Mesh / Hex Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Visual glowing aura circles */}
      <div className="absolute top-[20%] left-[25%] w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[25%] w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      
      {/* Centered Login Card */}
      <main className="z-10 animate-slide-in">
        <LoginForm />
      </main>
    </div>
  );
}
