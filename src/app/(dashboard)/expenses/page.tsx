'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Download, 
  PlusCircle, 
  TrendingUp, 
  Coins, 
  Tag,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X,
  Sparkles,
  Pencil,
  Trash2,
  AlertTriangle,
  Printer,
  Wallet,
  CheckCircle,
  FileText,
  Eye
} from 'lucide-react';
import * as xlsx from 'xlsx';

interface Expense {
  id: string;
  expenseDate: string;
  category: string;
  customCategory: string | null;
  amount: number;
  description: string | null;
  recordedById: string | null;
  createdAt: string;
}

interface Pagination {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Stats {
  totalAllTime: number;
  countAllTime: number;
  totalToday: number;
  totalFiltered: number;
  topCategory: string;
}

const EXPENSE_CATEGORIES = [
  'Handling charge',
  'Staff welfare expense',
  'License fees',
  'Rates & taxes',
  'Repairs and maintenance assets',
  'Service charges',
  'Water charge',
  'Telephone charges',
  'Electricity charges',
  'Cleaning charge',
  'Printing and stationary',
  'Rent',
  'Local conveyance',
  'Other miscellaneous exp',
  'Repairs and maintenance building',
  'Power and fuel',
  'Packing charge',
  'Daily wage',
  'Salary',
  'Remuneration',
  'Others'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [stats, setStats] = useState<Stats>({
    totalAllTime: 0,
    countAllTime: 0,
    totalToday: 0,
    totalFiltered: 0,
    topCategory: 'N/A'
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields State
  const [expenseDate, setExpenseDate] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Expense State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Expense State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // View Group Details State
  const [selectedGroupDate, setSelectedGroupDate] = useState<string | null>(null);

  // Set default date to local today
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setExpenseDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch Expenses with current pagination/filters
  const fetchExpenses = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '10',
      startDate: filterStartDate,
      endDate: filterEndDate,
      category: filterCategory,
      search: searchQuery
    });

    fetch(`/api/expenses?${params}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setExpenses(data.expenses || []);
          setPagination(data.pagination || { totalCount: 0, page: 1, limit: 10, totalPages: 1 });
          setStats(data.stats || { totalAllTime: 0, countAllTime: 0, totalToday: 0, totalFiltered: 0, topCategory: 'N/A' });
        } else {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch expenses error:', err);
        setError('Failed to fetch expense records');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, filterStartDate, filterEndDate, filterCategory]);

  // Group expenses by date (YYYY-MM-DD)
  const groupedExpenses: { [key: string]: Expense[] } = {};
  expenses.forEach(exp => {
    const dateKey = exp.expenseDate.split('T')[0];
    if (!groupedExpenses[dateKey]) {
      groupedExpenses[dateKey] = [];
    }
    groupedExpenses[dateKey].push(exp);
  });

  const groupedKeys = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));
  const selectedGroupItems = selectedGroupDate ? groupedExpenses[selectedGroupDate] || [] : [];

  // Close details modal if the group becomes empty (e.g. after deletion)
  useEffect(() => {
    if (selectedGroupDate && selectedGroupItems.length === 0) {
      setSelectedGroupDate(null);
    }
  }, [expenses, selectedGroupDate, selectedGroupItems]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchExpenses();
  };

  const handleClearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCategory('');
    setSearchQuery('');
    setCurrentPage(1);
    // Delay slightly to allow state updates to propogate
    setTimeout(() => {
      fetchExpenses();
    }, 20);
  };

  // Add Expense POST handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!expenseDate || !category || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    if (category === 'Others' && !customCategory.trim()) {
      setError('Please specify the custom category');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseDate,
          category,
          customCategory: category === 'Others' ? customCategory.trim() : null,
          amount: numericAmount,
          description: description.trim() || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to record expense');
      } else {
        setSuccessMessage('Expense recorded successfully!');
        // Reset form except date
        setCategory('');
        setCustomCategory('');
        setAmount('');
        setDescription('');
        
        // Refresh list
        setCurrentPage(1);
        fetchExpenses();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Trigger handler
  const handleTriggerEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDate(expense.expenseDate.split('T')[0]);
    setEditCategory(expense.category);
    setEditCustomCategory(expense.customCategory || '');
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description || '');
    setEditError('');
  };

  // Save Edit PUT handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    
    setEditError('');
    const numericAmount = parseFloat(editAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setEditError('Amount must be a positive number');
      return;
    }

    if (editCategory === 'Others' && !editCustomCategory.trim()) {
      setEditError('Please specify the custom category');
      return;
    }

    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseDate: editDate,
          category: editCategory,
          customCategory: editCategory === 'Others' ? editCustomCategory.trim() : null,
          amount: numericAmount,
          description: editDescription.trim() || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || 'Failed to update expense');
      } else {
        setEditingExpense(null);
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      setEditError('An error occurred during save.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteExpense = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/expenses/${deletingId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDeletingId(null);
        fetchExpenses();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete expense.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to server.');
    }
  };

  // Export to Excel handler
  const exportExcel = () => {
    // Generate data array for Excel
    const dataRows: (string | number)[][] = [
      ['SUPPLYCO OUTLET DAILY EXPENSE ARCHIVE REPORT'],
      [`Exported On: ${new Date().toLocaleDateString('en-IN')}`],
      [`Active Filters: ${filterCategory ? `Category: ${filterCategory}` : 'All Categories'}${filterStartDate ? `, Date Range: ${filterStartDate} to ${filterEndDate}` : ''}`],
      [''],
      ['EXPENSE DATE', 'CATEGORY', 'AMOUNT (₹)', 'REMARKS / DETAILS']
    ];

    // Add actual expenses (using all loaded expenses for active filters)
    expenses.forEach(exp => {
      const formattedDate = new Date(exp.expenseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const displayCategory = exp.category === 'Others' && exp.customCategory 
        ? `Others (${exp.customCategory})` 
        : exp.category;
      
      dataRows.push([
        formattedDate,
        displayCategory,
        exp.amount,
        exp.description || '-'
      ]);
    });

    dataRows.push(['']);
    dataRows.push(['TOTAL EXPENSES (FILTERED)', '', stats.totalFiltered]);

    const worksheet = xlsx.utils.aoa_to_sheet(dataRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Daily Expenses');
    
    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 18 }, // Date
      { wch: 35 }, // Category
      { wch: 15 }, // Amount
      { wch: 45 }  // Description
    ];

    const fileName = `supplyco_daily_expenses_${new Date().toISOString().slice(0,10)}.xlsx`;
    xlsx.writeFile(workbook, fileName);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* CSS Print Stylesheet injected dynamically */}
      <style jsx global>{`
        @media print {
          aside, 
          nav, 
          header, 
          button, 
          form, 
          .no-print, 
          .lg\\:hidden, 
          .lg\\:static {
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

          .print-header {
            display: block !important;
            margin-bottom: 24px;
            border-bottom: 2px solid #111;
            padding-bottom: 12px;
          }

          .print-title {
            font-size: 26px !important;
            font-weight: 800 !important;
            color: #000 !important;
            text-align: center !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .print-meta {
            margin-top: 8px;
            font-size: 12px !important;
            color: #444 !important;
            text-align: center !important;
          }

          .print-table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 15px;
          }

          .print-table th, .print-table td {
            border: 1px solid #ccc !important;
            padding: 10px 8px !important;
            font-size: 11px !important;
            color: black !important;
            text-align: left !important;
          }

          .print-table th {
            background-color: #f5f5f7 !important;
            font-weight: 700 !important;
            text-transform: uppercase;
          }

          .print-table td.text-right, .print-table th.text-right {
            text-align: right !important;
          }

          .print-summary-box {
            display: block !important;
            margin-top: 25px;
            border: 2px solid #333;
            padding: 15px;
            background-color: #fcfcfc !important;
            width: 50%;
            margin-left: auto;
          }

          .print-summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px !important;
            margin-bottom: 6px;
          }

          .print-summary-total {
            font-weight: 800;
            border-t: 1px solid #444;
            padding-top: 6px;
            font-size: 15px !important;
          }
        }
      `}</style>

      {/* Screen-Only Header */}
      <div className="no-print">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent glow-text">
          Daily Expense Tracker
        </h1>
        <p className="text-gray-400 mt-1">
          Record store expenses manually, select official accounting heads, filter records, and export to Excel/PDF.
        </p>
      </div>

      {/* Screen-Only Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Today's Expenses</span>
            <h4 className="text-xl font-bold text-white mt-1.5">{formatCurrency(stats.totalToday)}</h4>
          </div>
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Active Filter Sum</span>
            <h4 className="text-xl font-bold text-white mt-1.5">{formatCurrency(stats.totalFiltered)}</h4>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Highest Outlay Head</span>
            <h4 className="text-sm font-bold text-white mt-2 truncate max-w-[150px]" title={stats.topCategory}>
              {stats.topCategory}
            </h4>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Tag className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Total Logs Count</span>
            <h4 className="text-xl font-bold text-white mt-1.5">{stats.countAllTime} Records</h4>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Screen Layout: Two-Column Form & Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        
        {/* Left Column: Recording Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40 space-y-6 sticky top-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-wider uppercase flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-indigo-400" />
                <span>Log Daily Expense</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Manual entry of daily outlet expenses.</p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start space-x-2.5 animate-slide-in">
                <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center space-x-2.5 animate-slide-in">
                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Expense Date <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    onClick={e => e.currentTarget.showPicker()}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Expense Account Head <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    if (e.target.value !== 'Others') setCustomCategory('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#0b101f] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="" disabled>Select Expense Category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Sliding Sub-Input for custom categories */}
              {category === 'Others' && (
                <div className="animate-slide-in">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                    Specify Custom Category <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom expense type..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-indigo-500/25 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Amount (INR ₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-500 text-xs font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Remarks / Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter details like bill numbers, personnel, purpose..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98] mt-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                {submitting ? 'Recording Outflow...' : 'Record Expense'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Filters and Table list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters Widget Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4 flex items-center space-x-2">
              <Search className="h-4 w-4 text-indigo-400" />
              <span>Query Archives Filters</span>
            </h3>
            
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={e => setFilterStartDate(e.target.value)}
                      onClick={e => e.currentTarget.showPicker()}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/5 rounded-xl text-[11px] text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={e => setFilterEndDate(e.target.value)}
                      onClick={e => e.currentTarget.showPicker()}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/5 rounded-xl text-[11px] text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Category Head</label>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#0b101f] border border-white/5 rounded-xl text-[11px] text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-end pt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by remarks or custom category..."
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="flex space-x-3.5 w-full md:w-auto">
                  <button
                    type="submit"
                    className="flex-1 md:flex-none py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Table Container Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
            
            {/* Table Actions Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Expense Logs Archives</h3>
                <p className="text-xs text-gray-400 mt-0.5">List of recorded manual expenses for this account.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  disabled={expenses.length === 0}
                  className="flex items-center space-x-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all border border-white/5 disabled:opacity-50 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={exportExcel}
                  disabled={expenses.length === 0}
                  className="flex items-center space-x-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Table */}
            <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/10">
              <table className="min-w-full divide-y divide-white/5 text-left text-xs">
                <thead className="bg-white/5 text-gray-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Expense Date</th>
                    <th className="px-5 py-3.5">Categories Included</th>
                    <th className="px-5 py-3.5 text-right">Total Daily Outlay</th>
                    <th className="px-5 py-3.5">Items Count</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                        <Sparkles className="h-5 w-5 text-indigo-400 animate-spin mx-auto mb-2" />
                        <span>Loading expense reports database...</span>
                      </td>
                    </tr>
                  ) : groupedKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No expense logs match your query parameters. Enter values on the left form.
                      </td>
                    </tr>
                  ) : (
                    groupedKeys.map(dateKey => {
                      const groupItems = groupedExpenses[dateKey];
                      const totalAmount = groupItems.reduce((sum, item) => sum + item.amount, 0);
                      
                      // Build a nice comma-separated list of categories for preview
                      const categoryNames = groupItems.map(item => {
                        return item.category === 'Others' && item.customCategory 
                          ? item.customCategory 
                          : item.category;
                      });
                      const uniqueCategories = Array.from(new Set(categoryNames));
                      const categoriesPreview = uniqueCategories.join(', ');

                      return (
                        <tr key={dateKey} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4 font-semibold text-white whitespace-nowrap">
                            {new Date(dateKey + 'T00:00:00.000Z').toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-5 py-4 font-bold text-indigo-400 uppercase tracking-wide truncate max-w-[200px]" title={categoriesPreview}>
                            {categoriesPreview}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-white whitespace-nowrap">
                            {formatCurrency(totalAmount)}
                          </td>
                          <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-[10px] text-gray-300">
                              {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setSelectedGroupDate(dateKey)}
                                className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold px-1">View Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 text-xs font-semibold">
                <span className="text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={pagination.page === 1}
                    className="flex items-center space-x-1 py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={pagination.page === pagination.totalPages}
                    className="flex items-center space-x-1 py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =========================================
          PRINT ONLY VIEW FOR PDF GENERATION
          ========================================= */}
      <div className="print-header hidden">
        <div className="print-title">Supplyco Daily Expense Report</div>
        <div className="print-meta">
          Outlet Accounting Statement • Generated on {new Date().toLocaleString('en-IN')}
          {filterStartDate && ` • Date Range: ${filterStartDate} to ${filterEndDate}`}
          {filterCategory && ` • Category: ${filterCategory}`}
        </div>
      </div>

      <table className="print-table hidden">
        <thead>
          <tr>
            <th>Expense Date</th>
            <th>Expense Category Head</th>
            <th className="text-right">Amount (INR ₹)</th>
            <th>Details & Remarks</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(exp => (
            <tr key={exp.id}>
              <td>
                {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
              <td>
                {exp.category === 'Others' && exp.customCategory 
                  ? `Others - ${exp.customCategory}` 
                  : exp.category}
              </td>
              <td className="text-right">
                {exp.amount.toFixed(2)}
              </td>
              <td>
                {exp.description || '-'}
              </td>
            </tr>
          ))}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center' }}>No expense items logged.</td>
            </tr>
          )}
        </tbody>
      </table>

      {expenses.length > 0 && (
        <div className="print-summary-box hidden">
          <div className="print-summary-row">
            <span>Selected Items Count:</span>
            <span>{expenses.length} records</span>
          </div>
          <div className="print-summary-row print-summary-total">
            <span>Total Filtered Outlay:</span>
            <span>INR ₹{stats.totalFiltered.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* =========================================
          MODALS & OVERLAYS
          ========================================= */}

      {/* 1. EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slide-in no-print">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#090e1b]/95">
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Modify Expense Outflow</h3>
                  <p className="text-xs text-gray-400 mt-1">Audit values for recorded transaction</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="p-2 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editError && (
                <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center space-x-2 animate-slide-in">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    onClick={e => e.currentTarget.showPicker()}
                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Expense Account Head</label>
                  <select
                    required
                    value={editCategory}
                    onChange={e => {
                      setEditCategory(e.target.value);
                      if (e.target.value !== 'Others') setEditCustomCategory('');
                    }}
                    className="w-full px-3 py-2 bg-[#0b101f] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {editCategory === 'Others' && (
                  <div className="animate-slide-in">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">Specify Custom Category</label>
                    <input
                      type="text"
                      required
                      placeholder="Specify expense head..."
                      value={editCustomCategory}
                      onChange={e => setEditCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-indigo-500/25 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Remarks / Details</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-5 border-t border-white/5 bg-[#070b16]">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  {editSubmitting ? 'Saving changes...' : 'Save Outflow Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DELETE CONFIRMATION OVERLAY */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-slide-in no-print">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/5 shadow-2xl bg-[#090e1b] text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto animate-bounce">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confirm Deletion</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Are you absolutely sure you want to delete this expense record? This action is permanent and will deduct it from statistics.
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpense}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. VIEW GROUP DETAILS MODAL */}
      {selectedGroupDate && selectedGroupItems.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slide-in no-print">
          <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#090e1b]/95">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Expense Details — {new Date(selectedGroupDate + 'T00:00:00.000Z').toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Breakdown of {selectedGroupItems.length} logged expense outflow {selectedGroupItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupDate(null)}
                className="p-2 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[50vh]">
              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/10">
                <table className="min-w-full divide-y divide-white/5 text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Category Head</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3">Remarks / Details</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {selectedGroupItems.map(exp => (
                      <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-indigo-400 uppercase tracking-wide">
                          {exp.category === 'Others' && exp.customCategory ? (
                            <span className="flex flex-col">
                              <span>Others</span>
                              <span className="text-[10px] text-gray-400 lowercase normal-case mt-0.5">({exp.customCategory})</span>
                            </span>
                          ) : (
                            exp.category
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-white">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 max-w-[200px] truncate" title={exp.description || ''}>
                          {exp.description || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleTriggerEdit(exp)}
                              className="p-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Edit Item"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(exp.id)}
                              className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center p-5 border-t border-white/5 bg-[#070b16]">
              <div className="text-xs">
                <span className="text-gray-400">Daily Total: </span>
                <span className="font-bold text-white text-sm">
                  {formatCurrency(selectedGroupItems.reduce((sum, item) => sum + item.amount, 0))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupDate(null)}
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
