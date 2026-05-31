'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  BarChart3, 
  LineChart, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  UserCheck,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(user);

  useEffect(() => {
    if (!user) {
      // Try to fetch session on client if not passed from server
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) setActiveUser(data.user);
        })
        .catch(() => {});
    }
  }, [user]);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ingest Reports', href: '/upload', icon: Upload },
    { name: 'Daily Collections', href: '/daily-reports', icon: FileText },
    { name: 'Monthly Sales', href: '/sales-reports', icon: BarChart3 },
    { name: 'Daily Expenses', href: '/expenses', icon: Wallet },
    { name: 'Analytics Hub', href: '/analytics', icon: LineChart }
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-panel border-b border-white/5 text-white sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-indigo-400 glow-text" />
          <span className="font-bold tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">SUPPLYCO</span>
        </div>
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#070b18]/90 border-r border-white/5 flex flex-col z-40 p-4 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="flex items-center space-x-3 px-2 py-4 mb-6 border-b border-white/5">
          <TrendingUp className="h-7 w-7 text-indigo-400 glow-text" />
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            SUPPLYCO
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-1">
          {menuItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 font-medium' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'}
                `}
              >
                <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-400'}`} />
                <span className="text-sm tracking-wide">{item.name}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 glow-text" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        {activeUser && (
          <div className="glass-panel p-3.5 rounded-2xl border border-white/5 mt-auto mb-2 bg-indigo-950/10">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate leading-snug">{activeUser.name}</p>
                <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5">{activeUser.email}</p>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                SHOP
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all duration-200 mt-2 border border-transparent hover:border-rose-500/10 font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm tracking-wide">Logout</span>
        </button>
      </aside>
    </>
  );
}
