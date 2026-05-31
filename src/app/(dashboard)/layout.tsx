import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  
  // Protect all sub-routes inside the dashboard group
  if (!user) {
    redirect('/');
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#060913] text-[#f3f4f6]">
      {/* Shared Responsive Sidebar */}
      <Sidebar user={user} />
      
      {/* Scrollable Workspace View */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-slide-in">
          {children}
        </div>
      </main>
    </div>
  );
}
