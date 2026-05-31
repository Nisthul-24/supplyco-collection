'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  TrendingUp, 
  Coins, 
  CreditCard, 
  Smartphone, 
  Ticket,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X,
  Sparkles,
  Pencil,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import * as xlsx from 'xlsx';

interface DailyReport {
  id: string;
  reportDate: string;
  outletName: string;
  totalCollection: number;
  paymentDetails: {
    maveliSubsidy: number;
    maveliFssr: number;
    maveliSabariBp: number;
    maveliSabariTea: number;
    sabariCoOil: number;
    maveliOthers: number;
    nonMaveli: number;
    medical: number;
    nonMedical: number;
    petrolDiesel: number;
    lpg: number;
    others: number;
    roundOff: number;
    discounts: number;
    retailCollection: number;
    bulkCollection: number;
    creditCard: number;
    upi: number;
    coupons: number;
    amountToRemit: number;
  };
  fileName: string;
  uploadedFileUrl: string;
}

interface SummaryData {
  meta: { daysChecked: number };
  collections: {
    total: number;
    breakdown: DailyReport['paymentDetails'];
  };
}

export default function DailyReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals & Forms State
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  
  // Edited values binding state
  const [editOutletName, setEditOutletName] = useState('');
  const [editReportDate, setEditReportDate] = useState('');
  const [editTotalCollection, setEditTotalCollection] = useState(0);
  const [editDetails, setEditDetails] = useState<DailyReport['paymentDetails'] | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Date Range Combined Summary States
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      outlet: search,
      startDate,
      endDate
    });
    
    fetch(`/api/reports/daily?${params}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setReports(data.reports);
          setTotalPages(data.pagination.totalPages);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setSummary(null);
    setShowSummaryPanel(false);
    setTimeout(() => {
      fetchReports();
    }, 50);
  };

  // Generate date range audit summary
  const handleGenerateSummary = async () => {
    if (!startDate || !endDate) return;
    setGeneratingSummary(true);
    setShowSummaryPanel(true);
    
    try {
      const res = await fetch(`/api/reports/summary?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (!data.error) {
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // DELETE AUDIT TRIGGERS
  const handleDeleteReport = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/reports/daily/${deletingId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeletingId(null);
        fetchReports();
        // Reset summary if open
        if (showSummaryPanel) handleGenerateSummary();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete report.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // EDIT AUDIT TRIGGER
  const handleTriggerEdit = (report: DailyReport) => {
    setEditingReport(report);
    setEditOutletName(report.outletName);
    setEditReportDate(report.reportDate.split('T')[0]);
    setEditTotalCollection(report.totalCollection);
    setEditDetails({ ...report.paymentDetails });
    setEditError('');
  };

  const handleEditDetailsField = (key: keyof DailyReport['paymentDetails'], valStr: string) => {
    if (!editDetails) return;
    const numeric = parseFloat(valStr) || 0;
    setEditDetails(prev => prev ? {
      ...prev,
      [key]: numeric
    } : null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport || !editDetails) return;
    
    setEditSubmitting(true);
    setEditError('');

    try {
      const res = await fetch(`/api/reports/daily/${editingReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletName: editOutletName,
          reportDate: editReportDate,
          totalCollection: editTotalCollection,
          paymentDetails: editDetails
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setEditError(data.error || 'Failed to update record.');
        setEditSubmitting(false);
        return;
      }
      
      setEditingReport(null);
      fetchReports();
      if (showSummaryPanel) handleGenerateSummary();
      
    } catch (err: any) {
      setEditError(err.message || 'An error occurred during save.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const exportSingleDailyReportExcel = (report: DailyReport) => {
    const formattedDate = formatDate(report.reportDate);
    const details = report.paymentDetails;
    
    const dataRows = [
      [`DAILY COLLECTION REPORT - ${report.outletName.toUpperCase()}`],
      [`Date: ${formattedDate}`],
      [`File Source: ${report.fileName || 'N/A'}`],
      [''],
      ['COLLECTION CATEGORY', 'AMOUNT (RS.)'],
      ['(A). Maveli Subsidy Sales', details.maveliSubsidy || 0],
      ['(B). Maveli Fssr Sales', details.maveliFssr || 0],
      ['(C). Maveli Sabari Bp Sales', details.maveliSabariBp || 0],
      ['(D). Maveli Sabari Tea Sales', details.maveliSabariTea || 0],
      ['(E). Sabari Co Oil Sales', details.sabariCoOil || 0],
      ['(F). Maveli Others Sales', details.maveliOthers || 0],
      ['(G). Non-Maveli Sales', details.nonMaveli || 0],
      ['(H). Medical Sales', details.medical || 0],
      ['(I). Non-Medical Sales', details.nonMedical || 0],
      ['(J). Petrol/Diesel/Petro Products Sales', details.petrolDiesel || 0],
      ['(K). LPG Sales', details.lpg || 0],
      ['(L). Others Sales', details.others || 0],
      ['(M). Total Round-off Adjustments', details.roundOff || 0],
      ['(N). Total Staff/Kit/Special Discounts', details.discounts || 0],
      ['TOTAL COLLECTION (SUM REGULAR)', report.totalCollection],
      [''],
      ['PAYMENT CHANNEL BREAKDOWN', 'AMOUNT (RS.)'],
      ['Credit Card Payments', details.creditCard || 0],
      ['UPI (Digital QR) Payments', details.upi || 0],
      ['Coupons / Vouchers Payments', details.coupons || 0],
      ['Cash (Liquid Currency) Payments', report.totalCollection - (details.creditCard || 0) - (details.upi || 0) - (details.coupons || 0)],
      [''],
      ['TOTAL AMOUNT TO BE REMITTED', details.amountToRemit || 0]
    ];
    
    const worksheet = xlsx.utils.aoa_to_sheet(dataRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, `Daily ${formattedDate}`);
    worksheet['!cols'] = [{ wch: 45 }, { wch: 18 }];
    
    xlsx.writeFile(workbook, `Daily collection ${formattedDate}.xlsx`);
  };

  const exportSummaryExcel = () => {
    if (!summary) return;
    const breakdown = summary.collections.breakdown;
    
    const dataRows = [
      ['COMBINED DAILY COLLECTION SUMMARY AUDIT'],
      [`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`],
      [`Audited Records: ${summary.meta.daysChecked} reports`],
      [''],
      ['COLLECTION CATEGORIES', 'AMOUNT (RS.)'],
      ['(A). Maveli Subsidy Sales', breakdown.maveliSubsidy],
      ['(B). Maveli Fssr Sales', breakdown.maveliFssr],
      ['(C). Maveli Sabari Bp Sales', breakdown.maveliSabariBp],
      ['(D). Maveli Sabari Tea Sales', breakdown.maveliSabariTea],
      ['(E). Sabari Co Oil Sales', breakdown.sabariCoOil],
      ['(F). Maveli Others Sales', breakdown.maveliOthers],
      ['(G). Non-Maveli Sales', breakdown.nonMaveli],
      ['(H). Medical Sales', breakdown.medical],
      ['(I). Non-Medical Sales', breakdown.nonMedical],
      ['(J). Petrol/Diesel/Petro Products Sales', breakdown.petrolDiesel],
      ['(K). LPG Sales', breakdown.lpg],
      ['(L). Others Sales', breakdown.others],
      ['(M). Total Round-off Adjustments', breakdown.roundOff],
      ['(N). Total Staff/Kit/Special Discounts', breakdown.discounts],
      ['TOTAL COLLECTION (SUM REGULAR)', summary.collections.total],
      [''],
      ['COLLECTION CHANNEL BREAKDOWNS', 'AMOUNT (RS.)'],
      ['Credit Card Payments', breakdown.creditCard],
      ['UPI (Digital QR) Payments', breakdown.upi],
      ['Coupons / Vouchers Payments', breakdown.coupons],
      ['Cash (Liquid Currency) Payments', summary.collections.total - breakdown.creditCard - breakdown.upi - breakdown.coupons],
      [''],
      ['TOTAL AMOUNT TO BE REMITTED', breakdown.amountToRemit]
    ];
    
    const worksheet = xlsx.utils.aoa_to_sheet(dataRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Combined Audit');
    worksheet['!cols'] = [{ wch: 45 }, { wch: 18 }];
    
    xlsx.writeFile(workbook, `Daily collection ${formatDate(startDate)}__${formatDate(endDate)}.xlsx`);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Printing CSS for Daily Reports */}
      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
            margin: 15mm;
          }

          aside, nav, header, button, form, .no-print, .lg\\:hidden {
            display: none !important;
          }
          
          body, html, main, .max-w-7xl, .space-y-8 {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            display: block !important;
          }

          .glass-panel, .bg-\\[\\#090e1b\\]\\/95, .bg-\\[\\#070b16\\], .bg-white\\/5, .bg-black\\/10 {
            background: white !important;
            color: black !important;
            border-color: #e5e7eb !important;
            box-shadow: none !important;
            transform: none !important;
          }

          h1, h2, h3, h4, span, td, th, p {
            color: black !important;
            text-shadow: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent glow-text">
          Daily Collection Reports
        </h1>
        <p className="text-gray-400 mt-1">
          Browse daily cashbook registers, edit breakdowns, perform date-range audits, and delete records.
        </p>
      </div>

      {/* Summary Audit Builder Widget */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4 flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Date Range Summary Audit Builder</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                onClick={e => e.currentTarget.showPicker()}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                onClick={e => e.currentTarget.showPicker()}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateSummary}
              disabled={!startDate || !endDate || generatingSummary}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {generatingSummary ? 'Calculating...' : 'Generate Combined Audit'}
            </button>
            {(startDate || endDate) && (
              <button
                onClick={handleClearFilters}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all border border-white/5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Combined Summary Result Panel */}
        {showSummaryPanel && (
          <div className="mt-6 pt-6 border-t border-white/5 space-y-6 animate-slide-in">
            {generatingSummary ? (
              <div className="flex items-center justify-center py-10 space-x-3 text-gray-400">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-spin mx-auto" />
                <span className="text-xs font-medium">Aggregating records and calculating totals...</span>
              </div>
            ) : summary ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Total Combined Collection</span>
                      <h4 className="text-xl font-bold text-white mt-1.5">{formatCurrency(summary.collections.total)}</h4>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Coins className="h-5 w-5" /></div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Total Amount to Remit</span>
                      <h4 className="text-xl font-bold text-white mt-1.5">{formatCurrency(summary.collections.breakdown.amountToRemit)}</h4>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><TrendingUp className="h-5 w-5" /></div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Audited Reports Range</span>
                      <h4 className="text-xl font-bold text-white mt-1.5">{summary.meta.daysChecked} Days</h4>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20"><FileText className="h-5 w-5" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-3">Collection Breakdowns</h4>
                    <div className="mt-3 space-y-2.5 text-xs text-gray-300">
                      <div className="flex justify-between"><span>Maveli Subsidy</span><span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.maveliSubsidy)}</span></div>
                      <div className="flex justify-between"><span>Maveli FSSR</span><span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.maveliFssr)}</span></div>
                      <div className="flex justify-between"><span>Maveli Sabari BP</span><span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.maveliSabariBp)}</span></div>
                      <div className="flex justify-between"><span>Maveli Sabari Tea</span><span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.maveliSabariTea)}</span></div>
                      <div className="flex justify-between"><span>Sabari Coconut Oil</span><span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.sabariCoOil)}</span></div>
                      <div className="flex justify-between border-t border-white/5 pt-2"><span>Non-Maveli Sales</span><span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.nonMaveli)}</span></div>
                      <div className="flex justify-between"><span>Discounts</span><span className="font-semibold text-rose-400">-{formatCurrency(summary.collections.breakdown.discounts)}</span></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-3">Payment Distribution</h4>
                    <div className="mt-3 space-y-2.5 text-xs text-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center"><Smartphone className="h-4 w-4 text-emerald-400 mr-2" />UPI (Digital QR)</span>
                        <span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.upi)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center"><CreditCard className="h-4 w-4 text-indigo-400 mr-2" />Credit Card</span>
                        <span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.creditCard)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center"><Ticket className="h-4 w-4 text-amber-400 mr-2" />Coupons / Vouchers</span>
                        <span className="font-semibold text-white">{formatCurrency(summary.collections.breakdown.coupons)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="flex items-center"><Coins className="h-4 w-4 text-gray-400 mr-2" />Cash in Hand</span>
                        <span className="font-semibold text-white">{formatCurrency(summary.collections.total - summary.collections.breakdown.creditCard - summary.collections.breakdown.upi - summary.collections.breakdown.coupons)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all border border-white/5"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print PDF Format</span>
                  </button>
                  <button
                    onClick={exportSummaryExcel}
                    className="flex items-center space-x-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export Excel Summary</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs font-medium">Failed to calculate summary audit.</div>
            )}
          </div>
        )}
      </div>

      {/* Main Table Area */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-white tracking-wide">Historical Daily Collection Archives</h3>
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Outlet Name..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </form>
        </div>

        <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/10">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-white/5 text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Report Date</th>
                <th className="px-6 py-4">Outlet Name</th>
                <th className="px-6 py-4 text-right">Total Collection</th>
                <th className="px-6 py-4 text-right">Amount to Remit</th>
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    <Sparkles className="h-5 w-5 text-indigo-400 animate-spin mx-auto mb-2" />
                    <span>Loading daily collections registers...</span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No reports match your filters. Try uploading Daily spreadsheets.
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <tr key={report.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {new Date(report.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-400 uppercase tracking-wide truncate max-w-[200px]">
                      {report.outletName}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-white">
                      {formatCurrency(report.totalCollection)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                      {formatCurrency(report.paymentDetails.amountToRemit)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-[150px] truncate">
                      {report.fileName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleTriggerEdit(report)}
                          className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(report.id)}
                          className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportSingleDailyReportExcel(report)}
                          className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
                          title="Download Excel Report"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-xs font-semibold">
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="flex items-center space-x-1 py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center space-x-1 py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slide-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#090e1b]/95">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{selectedReport.outletName}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Daily register for {new Date(selectedReport.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Sales Ingestions</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400"><span>Maveli Subsidy</span><span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.maveliSubsidy)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Maveli FSSR</span><span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.maveliFssr)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Maveli Sabari BP</span><span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.maveliSabariBp)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Maveli Sabari Tea</span><span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.maveliSabariTea)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Sabari Coconut Oil</span><span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.sabariCoOil)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Non-Maveli Sales</span><span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.nonMaveli)}</span></div>
                    <div className="flex justify-between text-gray-400 border-t border-white/5 pt-2"><span>Discounts Mapped</span><span className="font-semibold text-rose-400">-{formatCurrency(selectedReport.paymentDetails.discounts)}</span></div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Payment Channels</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400 items-center">
                      <span className="flex items-center"><Smartphone className="h-4 w-4 text-emerald-400 mr-2" />UPI QR</span>
                      <span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.upi)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 items-center">
                      <span className="flex items-center"><CreditCard className="h-4 w-4 text-indigo-400 mr-2" />Credit Card</span>
                      <span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.creditCard)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 items-center">
                      <span className="flex items-center"><Ticket className="h-4 w-4 text-amber-400 mr-2" />Coupons</span>
                      <span className="font-semibold text-white">{formatCurrency(selectedReport.paymentDetails.coupons)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 items-center border-t border-white/5 pt-2">
                      <span className="flex items-center"><Coins className="h-4 w-4 text-gray-400 mr-2" />Remitted Cash</span>
                      <span className="font-semibold text-white">{formatCurrency(selectedReport.totalCollection - selectedReport.paymentDetails.upi - selectedReport.paymentDetails.creditCard - selectedReport.paymentDetails.coupons)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-wider block font-bold">Total Collection (H)</span>
                  <h4 className="text-lg font-bold text-white mt-0.5">{formatCurrency(selectedReport.totalCollection)}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Amount to Remit (P)</span>
                  <h4 className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(selectedReport.paymentDetails.amountToRemit)}</h4>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-white/5 bg-[#070b16] no-print">
              <a
                href={selectedReport.uploadedFileUrl}
                download
                className="flex items-center space-x-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all border border-white/5"
              >
                <Download className="h-4 w-4" />
                <span>Original File</span>
              </a>
              <button
                type="button"
                onClick={() => exportSingleDailyReportExcel(selectedReport)}
                className="flex items-center space-x-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Download Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = `Daily collection ${formatDate(selectedReport.reportDate)}`;
                  window.print();
                  document.title = originalTitle;
                }}
                className="flex items-center space-x-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="py-2 px-5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-slide-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/5 shadow-2xl bg-[#090e1b] text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confirm Deletion</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Are you absolutely sure you want to delete this Daily Collection report? This action is permanent and will remove all associated statistics.
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReport}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM EDIT MODAL (Pencil Trigger) */}
      {editingReport && editDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slide-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#090e1b]/95">
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Edit Daily Collection</h3>
                  <p className="text-xs text-gray-400 mt-1">Audit values for {editingReport.outletName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="p-2 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Grid */}
              <div className="p-6 overflow-y-auto max-h-[55vh] grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Meta Fields */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Outlet Name</label>
                    <input
                      type="text"
                      required
                      value={editOutletName}
                      onChange={e => setEditOutletName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Report Date</label>
                    <input
                      type="date"
                      required
                      value={editReportDate}
                      onChange={e => setEditReportDate(e.target.value)}
                      onClick={e => e.currentTarget.showPicker()}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Left Form: Categorized Sales */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Sales Categorizations</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Maveli Subsidy</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.maveliSubsidy}
                        onChange={e => handleEditDetailsField('maveliSubsidy', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Maveli FSSR</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.maveliFssr}
                        onChange={e => handleEditDetailsField('maveliFssr', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Sabari BP</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.maveliSabariBp}
                        onChange={e => handleEditDetailsField('maveliSabariBp', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Sabari Tea</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.maveliSabariTea}
                        onChange={e => handleEditDetailsField('maveliSabariTea', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Sabari Coc Oil</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.sabariCoOil}
                        onChange={e => handleEditDetailsField('sabariCoOil', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Non-Maveli Sales</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.nonMaveli}
                        onChange={e => handleEditDetailsField('nonMaveli', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Discounts</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.discounts}
                        onChange={e => handleEditDetailsField('discounts', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Round-Off</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDetails.roundOff}
                        onChange={e => handleEditDetailsField('roundOff', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Form: Payments */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Payment Splits</h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Total Collection (H)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editTotalCollection}
                        onChange={e => setEditTotalCollection(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[9px] text-gray-400 block mb-1">UPI QR</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editDetails.upi}
                          onChange={e => handleEditDetailsField('upi', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[9px] text-gray-400 block mb-1">Credit Card</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editDetails.creditCard}
                          onChange={e => handleEditDetailsField('creditCard', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[9px] text-gray-400 block mb-1">Coupons</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editDetails.coupons}
                          onChange={e => handleEditDetailsField('coupons', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mt-3 flex justify-between items-center">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">Auto-Recalculated Remit</span>
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(editTotalCollection - (editDetails.upi || 0) - (editDetails.creditCard || 0) - (editDetails.coupons || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {editError && (
                  <div className="md:col-span-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-white/5 bg-[#070b16]">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="py-2 px-5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving changes...' : 'Save Audit Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
