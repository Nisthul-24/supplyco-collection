'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  TrendingUp, 
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Coins,
  Pencil,
  Trash2,
  AlertTriangle,
  Printer
} from 'lucide-react';
import * as xlsx from 'xlsx';

interface SalesReport {
  id: string;
  reportMonth: string; // "YYYY-MM"
  outletName: string;
  subsidySales: number;
  nonSubsidySales: number;
  bulkSales: number;
  grandTotal: number;
  extraDetails: {
    subsidyMaveli: number;
    subsidyCocOil: number;
    sabariSales: number;
    others: number;
    fssr: number;
    bulkMaveli: number;
    bulkSabari: number;
    bulkNM: number;
    nonMaveliSales: number;
    cbValueNonMaveli: number;
    overageNonMaveli: number;
    totalWithoutBulk: number;
  };
  fileName: string;
  uploadedFileUrl: string;
}

export default function SalesReportsPage() {
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control state
  const [activeTab, setActiveTab] = useState<'archives' | 'compile'>('archives');

  // Compiler state
  const [compileMode, setCompileMode] = useState<'month' | 'range'>('month');
  const [compileStartDate, setCompileStartDate] = useState('');
  const [compileEndDate, setCompileEndDate] = useState('');
  const [compileTitle, setCompileTitle] = useState('');
  const [compileMonth, setCompileMonth] = useState('');
  const [compiledReports, setCompiledReports] = useState<any[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState('');

  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals & Forms State
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<SalesReport | null>(null);
  
  // Edited values binding state
  const [editOutletName, setEditOutletName] = useState('');
  const [editReportMonth, setEditReportMonth] = useState('');
  const [editExtraDetails, setEditExtraDetails] = useState<SalesReport['extraDetails'] | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchReports = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      outlet: search,
      month: selectedMonth
    });
    
    fetch(`/api/reports/sales?${params}`)
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
    setSelectedMonth('');
    setPage(1);
    setTimeout(() => {
      fetchReports();
    }, 50);
  };

  // DELETE AUDIT TRIGGER
  const handleDeleteReport = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/reports/sales/${deletingId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeletingId(null);
        fetchReports();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete report.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // EDIT AUDIT TRIGGER
  const handleTriggerEdit = (report: SalesReport) => {
    setEditingReport(report);
    setEditOutletName(report.outletName);
    setEditReportMonth(report.reportMonth);
    setEditExtraDetails({ ...report.extraDetails });
    setEditError('');
  };

  const handleEditDetailsField = (key: keyof SalesReport['extraDetails'], valStr: string) => {
    if (!editExtraDetails) return;
    const numeric = parseFloat(valStr) || 0;
    setEditExtraDetails(prev => prev ? {
      ...prev,
      [key]: numeric
    } : null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport || !editExtraDetails) return;
    
    setEditSubmitting(true);
    setEditError('');

    // Recalculate Combined Totals dynamically based on changes
    const b = editExtraDetails.subsidyMaveli;
    const c = editExtraDetails.subsidyCocOil;
    const totalSubsidy = b + c;
    
    const ee = editExtraDetails.sabariSales;
    const f = editExtraDetails.others;
    const g = editExtraDetails.fssr;
    const h = editExtraDetails.bulkMaveli;
    const i = editExtraDetails.bulkSabari;
    const j = editExtraDetails.bulkNM;
    const k = editExtraDetails.nonMaveliSales;
    const totalNonSubsidy = ee + f + g + h + i + j + k;
    
    const grand = totalSubsidy + totalNonSubsidy;
    const totalWithoutBulk = totalSubsidy + ee + f + g + k;

    const finalDetails = {
      ...editExtraDetails,
      totalWithoutBulk
    };

    try {
      const res = await fetch(`/api/reports/sales/${editingReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletName: editOutletName,
          reportMonth: editReportMonth,
          subsidySales: totalSubsidy,
          nonSubsidySales: totalNonSubsidy,
          bulkSales: h + i + j,
          grandTotal: grand,
          extraDetails: finalDetails
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
  };  const handleCompileReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (compileMode === 'month' && !compileMonth) return;
    if (compileMode === 'range' && (!compileStartDate || !compileEndDate)) return;
    
    setCompiling(true);
    setCompileError('');
    setCompiledReports([]);

    try {
      const url = compileMode === 'month' 
        ? `/api/reports/sales/compile?month=${compileMonth}`
        : `/api/reports/sales/compile?startDate=${compileStartDate}&endDate=${compileEndDate}`;
        
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setCompileError(data.error || 'Failed to compile reports');
      } else {
        setCompiledReports(data.reports || []);
        setCompileTitle(data.meta?.titleRange || '');
      }
    } catch (err) {
      console.error(err);
      setCompileError('An error occurred while compiling reports');
    } finally {
      setCompiling(false);
    }
  };

  const handleUpdateCompileValue = (index: number, field: 'cbValueNonMaveli' | 'overageNonMaveli', valueStr: string) => {
    const val = parseFloat(valueStr) || 0;
    setCompiledReports(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        extraDetails: {
          ...copy[index].extraDetails,
          [field]: val
        }
      };
      return copy;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return `${month}-${year}`;
  };

  const exportCompiledExcel = () => {
    if (compiledReports.length === 0) return;
    
    const displayTitle = compileTitle || (compileMonth ? `FOR THE MONTH ${formatMonth(compileMonth)}` : 'STATEMENT');

    const dataRows = [
      [`SALES COLLECTION DETAILS ${displayTitle.toUpperCase()}`],
      [compiledReports[0]?.outletName || 'SSM MUKKAM'],
      [
        'NAME OF OUTLET',
        'SUBSIDY SALES (RS.)', '', '',
        'NON SUBSIDY SALES', '', '', '', '', '',
        'Grand Total',
        'CB Value of Non Maveli Items',
        'Overage Nonmaveli',
        'Total sale without Bulk(Rs)'
      ],
      [
        '',
        'Maveli Items at Subsidy Rates (Other than subsidy C. Oil)',
        'Sale of Subsidy Coc. Oil',
        'Total Subsidy Sales',
        'Sabari Sales (Other than subsidy C. Oil)',
        'OTHERS',
        'FSSR',
        'Bulk Sales',
        'Non Maveli Sales',
        'Total Non-Subsidy Sales',
        '',
        '',
        '',
        ''
      ],
      [
        'a', 'b', 'c', 'd=b+c', 'e', 'f', 'g', 'h', 'i', 'L=e+f+g+h+i', 'm=d+l', 'n', 'o', 'T=(M-H)'
      ]
    ];

    compiledReports.forEach(r => {
      const b = r.extraDetails.subsidyMaveli;
      const c = r.extraDetails.subsidyCocOil;
      const d = b + c;
      const e = r.extraDetails.sabariSales;
      const f = r.extraDetails.others;
      const g = r.extraDetails.fssr;
      const h = r.extraDetails.bulkMaveli;
      const i = r.extraDetails.nonMaveliSales;
      const L = e + f + g + h + i;
      const m = d + L;
      const n = r.extraDetails.cbValueNonMaveli || 0;
      const o = r.extraDetails.overageNonMaveli || 0;
      const T = m - h;

      dataRows.push([
        r.outletName.toUpperCase(),
        b,
        c,
        d,
        e,
        f,
        g,
        h,
        i,
        L,
        m,
        n || '',
        o || '',
        T
      ]);
    });

    const worksheet = xlsx.utils.aoa_to_sheet(dataRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
      { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
      { s: { r: 2, c: 4 }, e: { r: 2, c: 9 } },
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
      { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
      { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } },
      { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } },
      { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } }
    ];

    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 }
    ];

    const fileName = compileMode === 'month' 
      ? `Sales report ${formatMonth(compileMonth)}.xlsx` 
      : `Sales report ${formatDate(compileStartDate)}__${formatDate(compileEndDate)}.xlsx`;
    xlsx.writeFile(workbook, fileName);
  };

  const exportSalesExcel = () => {
    if (reports.length === 0) return;
    
    const headers = [
      'OUTLET NAME',
      'REPORT MONTH',
      'MAVELI SUBSIDY (b)',
      'SUBSIDY COCONUT OIL (c)',
      'TOTAL SUBSIDY SALES (d=b+c)',
      'SABARI SALES (e)',
      'OTHERS (f)',
      'FSSR SALES (g)',
      'BULK MAVELI (h)',
      'BULK SABARI (i)',
      'BULK NM (j)',
      'NON-MAVELI SALES (k)',
      'TOTAL NON-SUBSIDY (l=e+f+g+h+i+j+k)',
      'GRAND TOTAL (m=d+l)',
      'CB VALUE NON-MAVELI (n)',
      'OVERAGE (o)',
      'TOTAL WITHOUT BULK (t=d+e+f+g+k)'
    ];
    
    const dataRows = reports.map(r => [
      r.outletName.toUpperCase(),
      r.reportMonth,
      r.extraDetails.subsidyMaveli,
      r.extraDetails.subsidyCocOil,
      r.subsidySales,
      r.extraDetails.sabariSales,
      r.extraDetails.others,
      r.extraDetails.fssr,
      r.extraDetails.bulkMaveli,
      r.extraDetails.bulkSabari,
      r.extraDetails.bulkNM,
      r.extraDetails.nonMaveliSales,
      r.nonSubsidySales,
      r.grandTotal,
      r.extraDetails.cbValueNonMaveli,
      r.extraDetails.overageNonMaveli,
      r.extraDetails.totalWithoutBulk
    ]);
    
    const worksheet = xlsx.utils.aoa_to_sheet([['MONTHLY SALES ARCHIVES REPORT'], [], headers, ...dataRows]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Archives');
    
    const fileSuffix = selectedMonth ? formatMonth(selectedMonth) : 'all';
    xlsx.writeFile(workbook, `Sales report ${fileSuffix}.xlsx`);
  };

  const exportSingleSalesReportExcel = (report: SalesReport) => {
    const formattedMonth = formatMonth(report.reportMonth);
    const details = report.extraDetails;
    
    const dataRows = [
      [`MONTHLY SALES REPORT - ${report.outletName.toUpperCase()}`],
      [`Report Period: ${formattedMonth}`],
      [`File Source: ${report.fileName || 'N/A'}`],
      [''],
      ['SALES CATEGORY / COLUMN', 'REFERENCE', 'AMOUNT (RS.)'],
      ['Maveli Items at Subsidy Rates (Other than subsidy C. Oil)', 'b', details.subsidyMaveli || 0],
      ['Sale of Subsidy Coc. Oil', 'c', details.subsidyCocOil || 0],
      ['Total Subsidy Sales', 'd = b + c', report.subsidySales || 0],
      ['Sabari Sales (Other than subsidy C. Oil)', 'e', details.sabariSales || 0],
      ['OTHERS', 'f', details.others || 0],
      ['FSSR', 'g', details.fssr || 0],
      ['Bulk Sales (Maveli + Sabari + NonMaveli)', 'h', report.bulkSales || 0],
      ['Non-Maveli Sales', 'i', details.nonMaveliSales || 0],
      ['Total Non-Subsidy Sales', 'L = e + f + g + h + i', report.nonSubsidySales || 0],
      ['Grand Total', 'm = d + L', report.grandTotal || 0],
      ['CB Value of Non-Maveli Items', 'n', details.cbValueNonMaveli || 0],
      ['Overage Non-Maveli', 'o', details.overageNonMaveli || 0],
      ['Total Sale without Bulk', 't = m - h', details.totalWithoutBulk || 0]
    ];
    
    const worksheet = xlsx.utils.aoa_to_sheet(dataRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, `Sales ${formattedMonth}`);
    worksheet['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 18 }];
    
    xlsx.writeFile(workbook, `Sales report ${report.outletName} ${formattedMonth}.xlsx`);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Printing CSS for Monthly Reports */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }

          aside, nav, header, button, form, .no-print, .lg\\:hidden, .lg\\:static {
            display: none !important;
          }
          
          body, html, main, .max-w-7xl, .space-y-8 {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          .print-compiled-container {
            display: block !important;
          }

          .print-compiled-table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 15px;
          }

          .print-compiled-table th, .print-compiled-table td {
            border: 1px solid #333 !important;
            padding: 5px 3px !important;
            font-size: 8px !important;
            color: black !important;
            text-align: left !important;
          }

          .print-compiled-table th {
            background-color: #f0f0f2 !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            text-align: center !important;
          }

          .print-compiled-table td.text-right {
            text-align: right !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="no-print">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent glow-text">
          Monthly Sales Reports
        </h1>
        <p className="text-gray-400 mt-1">
          Browse monthly outlet sales spreadsheets, drill down into subsidy details, edit audits, and delete records.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-white/5 space-x-6 no-print">
        <button
          onClick={() => setActiveTab('archives')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${activeTab === 'archives' ? 'text-indigo-400 font-bold font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <span>Uploaded Sales Files</span>
          {activeTab === 'archives' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 glow-text animate-slide-in" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('compile')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${activeTab === 'compile' ? 'text-indigo-400 font-bold font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <span>Compiled Sales Report</span>
          {activeTab === 'compile' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 glow-text animate-slide-in" />
          )}
        </button>
      </div>

      {activeTab === 'archives' ? (
        <>
          {/* Filters Widget */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4 flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Search & Filter Archives</span>
        </h3>
        
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Search Outlet</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search SSM Mukkam..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Filter Month</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                onClick={e => e.currentTarget.showPicker()}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
            >
              Apply Filter
            </button>
            {(search || selectedMonth) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all border border-white/5"
              >
                Clear
              </button>
            )}
            {reports.length > 0 && (
              <button
                type="button"
                onClick={exportSalesExcel}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all border border-transparent flex items-center justify-center"
                title="Export Filtered List to Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Table Grid */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
        <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/10">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-white/5 text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Report Month</th>
                <th className="px-6 py-4">Outlet Name</th>
                <th className="px-6 py-4 text-right">Subsidy Sales</th>
                <th className="px-6 py-4 text-right">Non-Subsidy Sales</th>
                <th className="px-6 py-4 text-right">Bulk Sales</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                    <Sparkles className="h-5 w-5 text-indigo-400 animate-spin mx-auto mb-2" />
                    <span>Loading monthly sales registers...</span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No reports match your filters. Try uploading Sales sheets in the Upload section.
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <tr key={report.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {new Date(report.reportMonth + '-15').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-400 uppercase tracking-wide truncate max-w-[200px]">
                      {report.outletName}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-white">
                      {formatCurrency(report.subsidySales)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-white">
                      {formatCurrency(report.nonSubsidySales)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-amber-500">
                      {formatCurrency(report.bulkSales)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {formatCurrency(report.grandTotal)}
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
                          onClick={() => exportSingleSalesReportExcel(report)}
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
    </>
  ) : (
        <div className="space-y-6 animate-slide-in">
          {/* Compiler Filters Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40 no-print">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Aggregate & Compile Sales Report</span>
            </h3>

            {/* Premium Compile Mode Selector Switch */}
            <div className="flex bg-white/5 p-1 rounded-xl max-w-xs mb-4">
              <button
                type="button"
                onClick={() => {
                  setCompileMode('month');
                  setCompiledReports([]);
                  setCompileError('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${compileMode === 'month' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Calendar Month
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompileMode('range');
                  setCompiledReports([]);
                  setCompileError('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${compileMode === 'range' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Date Range
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4 animate-fade-in">
              {compileMode === 'month'
                ? 'Select a month to compile daily collections uploaded for that period. This automatically calculates subsidy vs non-subsidy tallies.'
                : 'Select a custom start date and end date to compile daily collections uploaded in that range.'}
            </p>
            
            <form onSubmit={handleCompileReport} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {compileMode === 'month' ? (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Target Month</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input
                      type="month"
                      required
                      value={compileMonth}
                      onChange={e => setCompileMonth(e.target.value)}
                      onClick={e => e.currentTarget.showPicker()}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <input
                        type="date"
                        required
                        value={compileStartDate}
                        onChange={e => setCompileStartDate(e.target.value)}
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
                        required
                        value={compileEndDate}
                        onChange={e => setCompileEndDate(e.target.value)}
                        onClick={e => e.currentTarget.showPicker()}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`flex space-x-3 ${compileMode === 'month' ? 'md:col-span-2' : 'md:col-span-1'}`}>
                <button
                  type="submit"
                  disabled={compiling || (compileMode === 'month' ? !compileMonth : (!compileStartDate || !compileEndDate))}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                >
                  {compiling ? 'Aggregating daily receipts...' : 'Compile Sales Statement'}
                </button>
                {compiledReports.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all border border-white/5 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Print PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportCompiledExcel}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Export Excel</span>
                    </button>
                  </>
                )}
              </div>
            </form>

            {compileError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2 animate-slide-in">
                <AlertTriangle className="h-4 w-4" />
                <span>{compileError}</span>
              </div>
            )}
          </div>

          {/* Compiled Grid Preview Card */}
          {compiledReports.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40 space-y-4 no-print">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white tracking-wide uppercase">
                  SALES COLLECTION DETAILS {compileTitle.toUpperCase()}
                </h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
                  Outlet Compiled Ledger Preview
                </p>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/10">
                <table className="min-w-full divide-y divide-white/5 text-[11px] text-left">
                  <thead className="bg-[#0b101f] text-gray-300 font-bold text-center border-b border-white/10">
                    <tr className="divide-x divide-white/5 border-b border-white/5 text-[10px]">
                      <th rowSpan={2} className="px-3 py-3 text-left min-w-[120px]">NAME OF OUTLET</th>
                      <th colSpan={3} className="px-3 py-2 bg-indigo-950/20 text-indigo-300 border-b border-white/5">SUBSIDY SALES (RS.)</th>
                      <th colSpan={6} className="px-3 py-2 bg-purple-950/20 text-purple-300 border-b border-white/5">NON SUBSIDY SALES</th>
                      <th rowSpan={2} className="px-3 py-3">Grand Total</th>
                      <th rowSpan={2} className="px-3 py-3 max-w-[140px]">CB Value of Non Maveli Items</th>
                      <th rowSpan={2} className="px-3 py-3 max-w-[100px]">Overage Nonmaveli</th>
                      <th rowSpan={2} className="px-3 py-3 max-w-[140px]">Total sale without Bulk (Rs)</th>
                    </tr>
                    
                    <tr className="divide-x divide-white/5 border-b border-white/5 text-[9px] leading-tight">
                      <th className="px-2 py-2 max-w-[150px] font-normal">Maveli Items at Subsidy Rates (Other than subsidy C. Oil)</th>
                      <th className="px-2 py-2 font-normal">Sale of Subsidy Coc. Oil</th>
                      <th className="px-2 py-2 font-semibold">Total Subsidy Sales</th>
                      
                      <th className="px-2 py-2 max-w-[140px] font-normal">Sabari Sales (Other than subsidy C. Oil)</th>
                      <th className="px-2 py-2 font-normal">OTHERS</th>
                      <th className="px-2 py-2 font-normal">FSSR</th>
                      <th className="px-2 py-2 font-normal text-rose-400">Bulk Sales</th>
                      <th className="px-2 py-2 font-normal">Non Maveli Sales</th>
                      <th className="px-2 py-2 font-semibold">Total Non-Subsidy Sales</th>
                    </tr>

                    <tr className="divide-x divide-white/5 bg-white/5 text-[9px] text-gray-500 font-mono text-center">
                      <td className="px-2 py-1 text-left">a</td>
                      <td className="px-2 py-1">b</td>
                      <td className="px-2 py-1">c</td>
                      <td className="px-2 py-1 font-semibold text-gray-400">d = b + c</td>
                      <td className="px-2 py-1">e</td>
                      <td className="px-2 py-1">f</td>
                      <td className="px-2 py-1">g</td>
                      <td className="px-2 py-1 text-rose-500/70">h</td>
                      <td className="px-2 py-1">i</td>
                      <td className="px-2 py-1 font-semibold text-gray-400">L = e + f + g + h + i</td>
                      <td className="px-2 py-1 font-semibold text-emerald-400/80">m = d + L</td>
                      <td className="px-2 py-1">n</td>
                      <td className="px-2 py-1">o</td>
                      <td className="px-2 py-1 font-semibold text-gray-400">T = m - h</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {compiledReports.map((r, index) => {
                      const b = r.extraDetails.subsidyMaveli;
                      const c = r.extraDetails.subsidyCocOil;
                      const d = b + c;
                      const e = r.extraDetails.sabariSales;
                      const f = r.extraDetails.others;
                      const g = r.extraDetails.fssr;
                      const h = r.extraDetails.bulkMaveli;
                      const i = r.extraDetails.nonMaveliSales;
                      const L = e + f + g + h + i;
                      const m = d + L;
                      const n = r.extraDetails.cbValueNonMaveli || 0;
                      const o = r.extraDetails.overageNonMaveli || 0;
                      const T = m - h;

                      return (
                        <tr key={index} className="divide-x divide-white/5 hover:bg-white/5 transition-colors text-[11px]">
                          <td className="px-3 py-3 font-bold text-white uppercase text-left">{r.outletName}</td>
                          <td className="px-2 py-3 text-right">{b.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right">{c.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right font-semibold text-indigo-300">{d.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right">{e.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right">{f.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right">{g.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right text-rose-400 font-semibold">{h.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right">{i.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right font-semibold text-purple-300">{L.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right font-bold text-emerald-400">{m.toFixed(2)}</td>
                          
                          {/* Editable input field n */}
                          <td className="px-1 py-1 text-center">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={n || ''}
                              onChange={evt => handleUpdateCompileValue(index, 'cbValueNonMaveli', evt.target.value)}
                              className="w-20 px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-center text-white text-[11px] focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          
                          {/* Editable input field o */}
                          <td className="px-1 py-1 text-center">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={o || ''}
                              onChange={evt => handleUpdateCompileValue(index, 'overageNonMaveli', evt.target.value)}
                              className="w-20 px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-center text-white text-[11px] focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          
                          <td className="px-2 py-3 text-right font-semibold text-white">{T.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {compiledReports.length === 0 && !compiling && !compileError && (
            <div className="text-center py-12 glass-panel rounded-3xl border border-white/5 text-gray-500 no-print">
              Select a month and click compile monthly statement to load calculations.
            </div>
          )}
        </div>
      )}

      {/* Sales Details View Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slide-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#090e1b]/95">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{selectedReport.outletName}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sales metrics for {new Date(selectedReport.reportMonth + '-15').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
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
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Subsidy Sales (Rs.)</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400"><span>Maveli Items (b)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.subsidyMaveli)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Subsidy Coconut Oil (c)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.subsidyCocOil)}</span></div>
                    <div className="flex justify-between text-indigo-300 font-bold border-t border-white/5 pt-2"><span>Total Subsidy (d=b+c)</span><span>{formatCurrency(selectedReport.subsidySales)}</span></div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Non-Subsidy Sales (Rs.)</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400"><span>Sabari Sales (e)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.sabariSales)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Others (f)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.others)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>FSSR Sales (g)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.fssr)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Non-Maveli Sales (k)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.nonMaveliSales)}</span></div>
                    
                    <div className="pt-2 border-t border-white/5 mt-2 space-y-1.5">
                      <span className="text-[10px] text-gray-500 font-bold block uppercase">Bulk Sales Details:</span>
                      <div className="flex justify-between text-[11px] text-gray-400 pl-2"><span>Bulk Maveli (h)</span><span>{formatCurrency(selectedReport.extraDetails.bulkMaveli)}</span></div>
                      <div className="flex justify-between text-[11px] text-gray-400 pl-2"><span>Bulk Sabari (i)</span><span>{formatCurrency(selectedReport.extraDetails.bulkSabari)}</span></div>
                      <div className="flex justify-between text-[11px] text-gray-400 pl-2"><span>Bulk NM (j)</span><span>{formatCurrency(selectedReport.extraDetails.bulkNM)}</span></div>
                    </div>
                    
                    <div className="flex justify-between text-indigo-300 font-bold border-t border-white/5 pt-2"><span>Total Non-Subsidy (l)</span><span>{formatCurrency(selectedReport.nonSubsidySales)}</span></div>
                  </div>
                </div>

              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2.5 text-xs">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Audits & Non-Maveli CB Values</h4>
                <div className="flex justify-between text-gray-400"><span>Closing Stock (CB) Value of Non-Maveli Items (n)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.cbValueNonMaveli)}</span></div>
                <div className="flex justify-between text-gray-400"><span>Overage Non-Maveli (o)</span><span className="font-semibold text-white">{formatCurrency(selectedReport.extraDetails.overageNonMaveli)}</span></div>
                <div className="flex justify-between text-gray-400 border-t border-white/5 pt-2"><span>Total Sale without Bulk (t=d+e+f+g+k)</span><span className="font-semibold text-emerald-400">{formatCurrency(selectedReport.extraDetails.totalWithoutBulk)}</span></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Monthly Grand Total Sales (m=d+l)</span>
                  <h4 className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(selectedReport.grandTotal)}</h4>
                </div>
                <div className="text-right text-[10px] text-gray-500">
                  <span>Computed dynamically from parsed rows</span>
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
                onClick={() => exportSingleSalesReportExcel(selectedReport)}
                className="flex items-center space-x-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Download Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = `Sales report ${selectedReport.outletName} ${formatMonth(selectedReport.reportMonth)}`;
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
                Are you absolutely sure you want to delete this Monthly Sales report? This action is permanent and will remove all associated statistics.
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
      {editingReport && editExtraDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slide-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#090e1b]/95">
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Edit Monthly Sales Report</h3>
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
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Report Month (YYYY-MM)</label>
                    <input
                      type="text"
                      required
                      pattern="\d{4}-\d{2}"
                      value={editReportMonth}
                      onChange={e => setEditReportMonth(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Left Form: Subsidy Subcolumns */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Subsidy Sales</h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Maveli Items at Subsidy rates (b)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editExtraDetails.subsidyMaveli}
                        onChange={e => handleEditDetailsField('subsidyMaveli', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Sale of Subsidy Coconut Oil (c)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editExtraDetails.subsidyCocOil}
                        onChange={e => handleEditDetailsField('subsidyCocOil', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mt-3 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">Total Subsidy (d=b+c)</span>
                      <span className="font-bold text-white">
                        {formatCurrency(editExtraDetails.subsidyMaveli + editExtraDetails.subsidyCocOil)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Form: Non-Subsidy & Bulks */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Non-Subsidy Subcolumns</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Sabari Sales (e)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editExtraDetails.sabariSales}
                        onChange={e => handleEditDetailsField('sabariSales', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Others (f)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editExtraDetails.others}
                        onChange={e => handleEditDetailsField('others', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">FSSR Sales (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editExtraDetails.fssr}
                        onChange={e => handleEditDetailsField('fssr', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1">Non-Maveli (k)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editExtraDetails.nonMaveliSales}
                        onChange={e => handleEditDetailsField('nonMaveliSales', e.target.value)}
                        className="w-full px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 pt-2 border-t border-white/5 space-y-1">
                      <span className="text-[8px] text-gray-500 font-bold block uppercase">Bulk Sales Splits (h, i, j):</span>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Maveli"
                          value={editExtraDetails.bulkMaveli}
                          onChange={e => handleEditDetailsField('bulkMaveli', e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-white/5 rounded text-white text-[10px]"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Sabari"
                          value={editExtraDetails.bulkSabari}
                          onChange={e => handleEditDetailsField('bulkSabari', e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-white/5 rounded text-white text-[10px]"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="NM"
                          value={editExtraDetails.bulkNM}
                          onChange={e => handleEditDetailsField('bulkNM', e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-white/5 rounded text-white text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CB Stocks and Overage */}
                <div className="md:col-span-2 bg-white/5 border border-white/5 p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1">Closing Stock (CB) Value of Non-Maveli (n)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editExtraDetails.cbValueNonMaveli}
                      onChange={e => handleEditDetailsField('cbValueNonMaveli', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1">Overage Non-Maveli (o)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editExtraDetails.overageNonMaveli}
                      onChange={e => handleEditDetailsField('overageNonMaveli', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Calculated Grand Total Card */}
                <div className="md:col-span-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Auto-Computed Grand Total Sales (m=d+l)</span>
                    <span className="text-sm font-black text-white mt-1 block">
                      {formatCurrency(
                        (editExtraDetails.subsidyMaveli + editExtraDetails.subsidyCocOil) + 
                        (editExtraDetails.sabariSales + editExtraDetails.others + editExtraDetails.fssr + editExtraDetails.bulkMaveli + editExtraDetails.bulkSabari + editExtraDetails.bulkNM + editExtraDetails.nonMaveliSales)
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 block">Total without Bulk (t=d+e+f+g+k):</span>
                    <span className="font-semibold text-gray-300 block">
                      {formatCurrency(
                        (editExtraDetails.subsidyMaveli + editExtraDetails.subsidyCocOil) + 
                        editExtraDetails.sabariSales + editExtraDetails.others + editExtraDetails.fssr + editExtraDetails.nonMaveliSales
                      )}
                    </span>
                  </div>
                </div>

                {editError && (
                  <div className="md:col-span-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2 animate-slide-in">
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
      {/* =========================================
          PRINT ONLY VIEW FOR MONTHLY COMPILED REPORT
          ========================================= */}
      {compiledReports.length > 0 && activeTab === 'compile' && (
        <div className="print-compiled-container hidden">
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
              SALES COLLECTION DETAILS {compileTitle.toUpperCase()}
            </h2>
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '3px 0 0 0' }}>
              {compiledReports[0]?.outletName || 'SSM MUKKAM'}
            </h3>
          </div>

          <table className="print-compiled-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ textAlign: 'left' }}>NAME OF OUTLET</th>
                <th colSpan={3}>SUBSIDY SALES (RS.)</th>
                <th colSpan={6}>NON SUBSIDY SALES</th>
                <th rowSpan={2}>Grand Total</th>
                <th rowSpan={2}>CB Value of Non Maveli Items</th>
                <th rowSpan={2}>Overage Nonmaveli</th>
                <th rowSpan={2}>Total sale without Bulk(Rs)</th>
              </tr>
              <tr>
                <th>Maveli Items at Subsidy Rates (Other than subsidy C. Oil)</th>
                <th>Sale of Subsidy Coc. Oil</th>
                <th>Total Subsidy Sales</th>
                <th>Sabari Sales (Other than subsidy C. Oil)</th>
                <th>OTHERS</th>
                <th>FSSR</th>
                <th>Bulk Sales</th>
                <th>Non Maveli Sales</th>
                <th>Total Non-Subsidy Sales</th>
              </tr>
              <tr style={{ fontStyle: 'italic', color: '#555', fontFamily: 'monospace' }}>
                <td style={{ textAlign: 'left' }}>a</td>
                <td style={{ textAlign: 'center' }}>b</td>
                <td style={{ textAlign: 'center' }}>c</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>d=b+c</td>
                <td style={{ textAlign: 'center' }}>e</td>
                <td style={{ textAlign: 'center' }}>f</td>
                <td style={{ textAlign: 'center' }}>g</td>
                <td style={{ textAlign: 'center' }}>h</td>
                <td style={{ textAlign: 'center' }}>i</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>L=e+f+g+h+i</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>m=d+l</td>
                <td style={{ textAlign: 'center' }}>n</td>
                <td style={{ textAlign: 'center' }}>o</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>T=(M-H)</td>
              </tr>
            </thead>
            <tbody>
              {compiledReports.map((r, index) => {
                const b = r.extraDetails.subsidyMaveli;
                const c = r.extraDetails.subsidyCocOil;
                const d = b + c;
                const e = r.extraDetails.sabariSales;
                const f = r.extraDetails.others;
                const g = r.extraDetails.fssr;
                const h = r.extraDetails.bulkMaveli;
                const i = r.extraDetails.nonMaveliSales;
                const L = e + f + g + h + i;
                const m = d + L;
                const n = r.extraDetails.cbValueNonMaveli || 0;
                const o = r.extraDetails.overageNonMaveli || 0;
                const T = m - h;

                return (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{r.outletName}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{b.toFixed(2)}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{c.toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 'bold', textAlign: 'right' }}>{d.toFixed(2)}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{e.toFixed(2)}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{f.toFixed(2)}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{g.toFixed(2)}</td>
                    <td className="text-right" style={{ textAlign: 'right', color: 'red' }}>{h.toFixed(2)}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{i.toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 'bold', textAlign: 'right' }}>{L.toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 'bold', textAlign: 'right' }}>{m.toFixed(2)}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{n ? n.toFixed(2) : '-'}</td>
                    <td className="text-right" style={{ textAlign: 'right' }}>{o ? o.toFixed(2) : '-'}</td>
                    <td className="text-right" style={{ fontWeight: 'bold', textAlign: 'right' }}>{T.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
