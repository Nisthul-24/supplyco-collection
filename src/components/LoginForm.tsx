'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Lock, 
  Mail, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  User,
  ShieldCheck
} from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  
  // Tab state: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Shared Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration-Only Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('SHOP');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'login') {
        // --- LOGIN FLOW ---
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Authentication failed. Please verify credentials.');
          setLoading(false);
          return;
        }
        
        router.push('/dashboard');
        router.refresh();
        
      } else {
        // --- REGISTER FLOW ---
        if (!name) {
          setError('Shop/Outlet Name is required for account creation');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Failed to create shop account.');
          setLoading(false);
          return;
        }

        setSuccess('Shop account created! Logging you in...');
        
        // AUTO-LOGIN INSTANTLY FOR AMAZING UX
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (loginRes.ok) {
          router.push('/dashboard');
          router.refresh();
        } else {
          // Fall back to sign in tab if auto-login fails
          setActiveTab('login');
          setLoading(false);
        }
      }
      
    } catch (err: any) {
      setError('A network connection error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass-panel rounded-3xl border border-white/5 relative overflow-hidden bg-[#070b16]/75 shadow-2xl">
      {/* Decorative Glows */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Header Logo */}
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 mx-auto mb-4 animate-bounce">
          <TrendingUp className="h-6 w-6 glow-text" />
        </div>
        <h2 className="text-2xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-wide uppercase">
          Supplyco Collection
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Secure central directory for shop collections & sales audits
        </p>
      </div>

      {/* Navigation Tabs (Login vs Register Toggle) */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl border border-white/5 mb-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
          className={`py-2 rounded-lg text-center transition-all ${activeTab === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
          className={`py-2 rounded-lg text-center transition-all ${activeTab === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
        >
          Register Shop
        </button>
      </div>

      {/* Interactive Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Registration-Only Full Name Field */}
        {activeTab === 'register' && (
          <div className="animate-slide-in">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Shop / Outlet Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mukkam Super Market"
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Corporate Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. mukkam@supplyco.com"
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Secret Credentials</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2 animate-slide-in">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2 animate-slide-in">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-emerald-400 animate-spin" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center space-x-2 w-full p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all duration-200 font-bold text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 animate-spin text-white" />
              <span>Processing secure handshake...</span>
            </span>
          ) : (
            <>
              <span>{activeTab === 'login' ? 'Establish Session Securely' : 'Provision Shop Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

    </div>
  );
}
