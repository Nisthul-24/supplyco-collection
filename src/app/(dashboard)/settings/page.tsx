'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  ShieldAlert, 
  UserPlus, 
  Mail, 
  Lock, 
  Settings, 
  Trash2, 
  Sparkles,
  Shield,
  Clock,
  Key
} from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const sessionRes = await fetch('/api/auth/me');
      const sessionData = await sessionRes.json();
      if (sessionData.user) {
        setCurrentUser(sessionData.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-64 glass-panel rounded-3xl animate-pulse" />
          <div className="h-64 lg:col-span-2 glass-panel rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent glow-text">
          Shop Configurations & Profile
        </h1>
        <p className="text-gray-400 mt-1">
          Review your shop credentials, active session status, and secure boundary audits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card Left Column */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4 flex items-center space-x-2">
              <Settings className="h-4 w-4 text-indigo-400" />
              <span>Shop Profile Identity</span>
            </h3>

            {currentUser && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="h-10 w-10 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-bold uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white uppercase truncate">{currentUser.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-2">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">Security Credentials</span>
                    <span className="text-gray-300 font-semibold flex items-center">
                      <Key className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                      Session Encrypted
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">Account Classification</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      REGISTERED SHOP
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Upload Boundary Status</span>
                    <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-wider">Active & Secure</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Isolation Audits and Security Boundaries Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center space-x-2">
              <Shield className="h-4.5 w-4.5 text-indigo-400" />
              <span>🔐 Row-Level Shop Isolation & Integrity Audits</span>
            </h3>

            <p className="text-xs text-gray-300 leading-relaxed">
              This deployment is configured with **Strict Shop Tenant Isolation**. Every report, spreadsheet ingestion, and dynamic aggregation dashboard is row-locked to the authenticated credentials of your specific outlet. 
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Private Ledger Boundaries</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Only spreadsheets and PDFs uploaded by your active logged-in account are compiled into your analytics charts, summaries, and date-range calculators. Other registered outlets have absolute zero visibility.
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Duplicate Ingestion Guard</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  SHA-256 binary validation blocks double submissions of identical sales files, guaranteeing absolute integrity of historical registers. Deleting a report instantly releases the hash locks.
                </p>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Corporate Audit Logs Disclaimer</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                All deletions and updates performed on POS records are strictly cataloged in real time. Modifications to regular daily remittance calculations or monthly category splits are immediately reflected across live dashboards.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
