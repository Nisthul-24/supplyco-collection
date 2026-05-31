'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  UploadCloud, 
  FileSpreadsheet, 
  Calendar,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Smartphone,
  Ticket,
  Coins
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

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

export default function Dashboard() {
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
        console.error('Fetch analytics error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-72 bg-white/5 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 glass-panel rounded-2xl lg:col-span-2 animate-pulse" />
          <div className="h-96 glass-panel rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Fallback default state
  const metrics = data?.metrics || {
    totalDailyReports: 0,
    totalSalesReports: 0,
    latestDate: null,
    todayCollection: 0,
    totalSalesAllTime: 0,
    totalCollectionAllTime: 0
  };

  const paymentData = data?.paymentMethods || [];
  const dailyTrends = data?.dailyTrends || [];
  const monthlyTrends = data?.monthlyTrends || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent glow-text">
            Performance Overview
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time collection audits and monthly sales pipeline insights.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-indigo-400">
          <Calendar className="h-4 w-4" />
          <span>Last Audited: {metrics.latestDate ? new Date(metrics.latestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No reports ingested'}</span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Today's Collection */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-24 w-24 text-indigo-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Latest Collection</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{formatCurrency(metrics.todayCollection)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-indigo-400 font-medium">
            <span>Aggregated single-day remitted cash</span>
          </div>
        </div>

        {/* Metric 2: Monthly Sales */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="h-24 w-24 text-emerald-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">All-Time Sales</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{formatCurrency(metrics.totalSalesAllTime)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-400 font-medium">
            <span>Cumulative monthly sheet grand total</span>
          </div>
        </div>

        {/* Metric 3: Daily Reports */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UploadCloud className="h-24 w-24 text-purple-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Daily Uploads</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{metrics.totalDailyReports} Sheets</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-purple-400 font-medium">
            <span>Verified single-day sheets in database</span>
          </div>
        </div>

        {/* Metric 4: Sales Sheets */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileSpreadsheet className="h-24 w-24 text-amber-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly Sales Sheets</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{metrics.totalSalesReports} Records</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-amber-400 font-medium">
            <span>Consolidated outlet sales months</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trends Area Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white tracking-wide">Daily Collection Stream</h3>
            <span className="text-xs text-gray-400">Last 30 report periods</span>
          </div>
          <div className="h-80">
            {mounted && dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10}
                    tickFormatter={(tick) => {
                      const d = new Date(tick);
                      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    }} 
                  />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0a0e1a', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Collection']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                No collection records found. Please ingest daily sheets in the Upload section.
              </div>
            )}
          </div>
        </div>

        {/* Payment Channels Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white tracking-wide">Collection Channels</h3>
            <span className="text-xs text-gray-400">Payment Breakdown</span>
          </div>
          <div className="h-64 relative flex items-center justify-center">
            {mounted && paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                No payment breakdown data.
              </div>
            )}
          </div>
          {/* Pie Chart Legend */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {paymentData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400 truncate">{item.name}</p>
                  <p className="text-xs font-semibold text-white">{formatCurrency(item.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subsidy vs Non-Subsidy comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Breakdown */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white tracking-wide">Monthly Sales Composition</h3>
            <span className="text-xs text-gray-400">Subsidy vs Non-Subsidy</span>
          </div>
          <div className="h-80">
            {mounted && monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0a0e1a', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  <Bar dataKey="subsidy" name="Subsidy Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nonSubsidy" name="Non-Subsidy Sales" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                No monthly sales reports available.
              </div>
            )}
          </div>
        </div>

        {/* Highest / Lowest Outlets ranking */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-bold text-white tracking-wide mb-6">Top Outlets Ranking</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-80 pr-1">
            {data?.outletTrends && data.outletTrends.length > 0 ? (
              data.outletTrends.map((outlet, index) => (
                <div key={outlet.name} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold 
                      ${index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                        index === 1 ? 'bg-slate-400/20 text-gray-300 border border-slate-400/30' :
                        index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' : 
                        'bg-white/5 text-gray-400'}`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs font-bold text-gray-200 truncate pr-2 uppercase">{outlet.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{formatCurrency(outlet.sales || outlet.collections)}</p>
                    <p className="text-[9px] text-gray-400">{outlet.sales > 0 ? 'Monthly Sales' : 'Daily Collection'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                No rankings available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
