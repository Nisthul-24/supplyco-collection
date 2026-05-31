'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Smartphone, 
  CreditCard, 
  Coins, 
  Calendar,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface AnalyticsData {
  metrics: {
    totalDailyReports: number;
    totalSalesReports: number;
    latestDate: string | null;
    todayCollection: number;
    totalSalesAllTime: number;
    totalCollectionAllTime: number;
  };
  dailyTrends: Array<{ date: string; total: number; upi: number; card: number; cash: number; outlet: string }>;
  monthlyTrends: Array<{ month: string; subsidy: number; nonSubsidy: number; bulk: number; total: number }>;
  outletTrends: Array<{ name: string; sales: number; collections: number }>;
  paymentMethods: Array<{ name: string; value: number }>;
}

const COLORS = ['#6366f1', '#10b981', '#a855f7', '#f59e0b'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[450px] lg:col-span-2 glass-panel rounded-3xl animate-pulse" />
          <div className="h-[450px] glass-panel rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // 1. Calculate Custom Insights on Client
  const dailyTrends = data?.dailyTrends || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const outletTrends = data?.outletTrends || [];
  const paymentMethods = data?.paymentMethods || [];

  // Highest & Lowest collection days
  const sortedDaily = [...dailyTrends].sort((a, b) => b.total - a.total);
  const highestDay = sortedDaily[0] || null;
  const lowestDay = sortedDaily[sortedDaily.length - 1] || null;

  // Subsidy Ratio
  let overallSubsidy = 0;
  let overallGrandSales = 0;
  monthlyTrends.forEach(m => {
    overallSubsidy += m.subsidy;
    overallGrandSales += m.total;
  });
  const subsidyRatio = overallGrandSales > 0 ? (overallSubsidy / overallGrandSales) * 100 : 0;

  // Digital vs Cash Ratio
  let overallDigital = 0;
  let overallCollections = 0;
  paymentMethods.forEach(p => {
    overallCollections += p.value;
    if (p.name === 'UPI' || p.name === 'Credit Card') {
      overallDigital += p.value;
    }
  });
  const digitalRatio = overallCollections > 0 ? (overallDigital / overallCollections) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent glow-text">
          Analytics Intelligence Hub
        </h1>
        <p className="text-gray-400 mt-1">
          Algorithmic sales breakdowns, subsidy distribution indexes, and cash flow audit metrics.
        </p>
      </div>

      {/* Dynamic Financial Insights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-indigo-500">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Subsidy Dependency</span>
          <h4 className="text-xl font-bold text-white mt-1.5">{subsidyRatio.toFixed(1)}%</h4>
          <span className="text-[10px] text-indigo-400 font-medium block mt-1">Ratio of subsidy items to overall sales</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Digital Adoption</span>
          <h4 className="text-xl font-bold text-white mt-1.5">{digitalRatio.toFixed(1)}%</h4>
          <span className="text-[10px] text-emerald-400 font-medium block mt-1">UPI & Credit Card share of collections</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Peak Collection Period</span>
          <h4 className="text-sm font-bold text-white mt-2 truncate">
            {highestDay ? `${new Date(highestDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (${formatCurrency(highestDay.total)})` : 'N/A'}
          </h4>
          <span className="text-[10px] text-amber-400 font-medium block mt-1">Highest recorded singular daily cashbook</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-rose-500">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Trough Collection Period</span>
          <h4 className="text-sm font-bold text-white mt-2 truncate">
            {lowestDay ? `${new Date(lowestDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (${formatCurrency(lowestDay.total)})` : 'N/A'}
          </h4>
          <span className="text-[10px] text-rose-400 font-medium block mt-1">Lowest recorded singular daily cashbook</span>
        </div>
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Full daily stream Area chart */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Daily Collection & UPI Flow</h3>
              <p className="text-xs text-gray-400 mt-1">Dual-series aggregation showing total collection vs QR Code UPI adoption</p>
            </div>
            <span className="text-xs text-gray-500 px-2 py-1 rounded bg-white/5">Daily Stream</span>
          </div>
          <div className="h-96">
            {mounted && dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colUPI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0a0e1a', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="total" name="Total Daily Collection" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colTotal)" />
                  <Area type="monotone" dataKey="upi" name="UPI QR Channel" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colUPI)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                No collection records found.
              </div>
            )}
          </div>
        </div>

        {/* Dynamic AI-like Summary insights */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col bg-[#090e1b]/60">
          <h3 className="text-lg font-bold text-white tracking-wide mb-4 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-400 glow-text" />
            <span>AI Auditing Assistant</span>
          </h3>
          <div className="space-y-4 text-xs leading-relaxed text-gray-400 flex-1 overflow-y-auto max-h-[380px] pr-1">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-300">
              <span className="font-bold text-indigo-400 uppercase tracking-wider block text-[10px] mb-1">Government Subsidy Impact</span>
              <span>
                Subsidy sales represent **{subsidyRatio.toFixed(1)}%** of all shop grand sales. This indicates a high level of government-subsidized item circulation across outlets. The non-subsidy commercial pipeline contributes the remaining **{(100 - subsidyRatio).toFixed(1)}%**.
              </span>
            </div>
            
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-300">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block text-[10px] mb-1">Liquidity & Remittance Stream</span>
              <span>
                With a digital adoption index of **{digitalRatio.toFixed(1)}%**, the majority of daily transaction values are processed via **{digitalRatio > 50 ? 'QR Code UPI / Credit Card' : 'Liquid Cash'}**. Remittance operations are highly optimized, with **{formatCurrency(data?.metrics?.totalCollectionAllTime || 0)}** successfully reconciled all-time.
              </span>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-300">
              <span className="font-bold text-amber-400 uppercase tracking-wider block text-[10px] mb-1">Outlet Pipeline Ranker</span>
              <span>
                {outletTrends.length > 0 ? (
                  <span>
                    The highest-performing location is **{outletTrends[0].name.toUpperCase()}** with total aggregated sales of **{formatCurrency(outletTrends[0].sales || outletTrends[0].collections)}**, leading local business volumes.
                  </span>
                ) : (
                  <span>No outlet performance rankings computed yet.</span>
                )}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly stacked subsidy sales */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white tracking-wide">Monthly Subsidy sales Stack</h3>
            <span className="text-xs text-gray-500">Sales Breakdown</span>
          </div>
          <div className="h-80">
            {mounted && monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0a0e1a', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '10px' }} />
                  <Bar dataKey="subsidy" name="Subsidy Sales" stackId="a" fill="#6366f1" />
                  <Bar dataKey="nonSubsidy" name="Non-Subsidy Sales" stackId="a" fill="#a855f7" />
                  <Bar dataKey="bulk" name="Bulk/Other Sales" stackId="a" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                No monthly sales reports available.
              </div>
            )}
          </div>
        </div>

        {/* Outlet Rankings Comparison Bar */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white tracking-wide">SSM Retail Rankings Comparison</h3>
            <span className="text-xs text-gray-500">Outlet Performance</span>
          </div>
          <div className="h-80">
            {mounted && outletTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outletTrends} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={8} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0a0e1a', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
                  />
                  <Bar dataKey="sales" name="Grand Total Sales" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                No outlet rankings available.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
