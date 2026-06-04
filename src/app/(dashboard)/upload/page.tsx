'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles,
  Info,
  ArrowRight,
  Download
} from 'lucide-react';

interface IngestionResult {
  message: string;
  reportType: 'daily' | 'sales';
  parsedCount: number;
  fileName: string;
  fileHash: string;
}

export default function UploadPage() {
  const [reportType, setReportType] = useState<'daily' | 'sales'>('daily');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Custom manual Date picker states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Progress states: 'idle' | 'uploading' | 'parsing' | 'success' | 'error'
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<IngestionResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'pdf'].includes(ext || '')) {
      setErrorMessage('Unsupported file format. Please upload Excel (.xlsx, .xls) or PDF (.pdf) files.');
      setStatus('error');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setStatus('idle');
    setErrorMessage('');
    setResult(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setResult(null);
    setSelectedDate('');
    setSelectedMonth('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    
    // Strict user entry validation
    if (reportType === 'daily' && !selectedDate) {
      setErrorMessage('Please select the specific day/date of the report you are uploading.');
      setStatus('error');
      return;
    }
    if (reportType === 'sales' && !selectedMonth) {
      setErrorMessage('Please select the month of the sales report you are uploading.');
      setStatus('error');
      return;
    }
    
    setStatus('uploading');
    setProgress(10);
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reportType', reportType);
    if (reportType === 'daily') {
      formData.append('reportDate', selectedDate);
    } else {
      formData.append('reportMonth', selectedMonth);
    }
    
    // Simulate upload progress interval
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      let errorMsg = 'Ingestion failed. Ensure the report has valid format structures.';
      let data = null;
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
        if (data && data.error) {
          errorMsg = data.error;
        }
      } else {
        const text = await res.text();
        errorMsg = text || `Server returned error status: ${res.status} ${res.statusText}`;
        if (errorMsg.includes('<') && errorMsg.includes('>')) {
          errorMsg = `Server error (${res.status}): The upload request could not be processed. Please check if the database or server is reachable.`;
        }
      }
      
      if (!res.ok) {
        setErrorMessage(errorMsg);
        setStatus('error');
        return;
      }
      
      setProgress(100);
      setStatus('success');
      setResult(data);
      
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMessage(err.message || 'A network error occurred. Please check connectivity.');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent glow-text">
          Ingest New Reports
        </h1>
        <p className="text-gray-400 mt-1">
          Upload accounting sheets to automatically parse payments, subsidy metrics, and outlet figures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Panel Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
            {/* Form Selection */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                1. Select Document Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setReportType('daily'); removeFile(); }}
                  className={`
                    flex items-center justify-center space-x-3 p-4 rounded-xl border transition-all duration-200 font-medium text-sm
                    ${reportType === 'daily'
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <FileText className="h-5 w-5" />
                  <span>Daily Collection Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setReportType('sales'); removeFile(); }}
                  className={`
                    flex items-center justify-center space-x-3 p-4 rounded-xl border transition-all duration-200 font-medium text-sm
                    ${reportType === 'sales'
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>Monthly Sales Report</span>
                </button>
              </div>
            </div>

            {/* Step 2: Date Selector */}
            <div className="mb-6 animate-slide-in">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                {reportType === 'daily' 
                  ? '2. Enter POS Report Date (Specific Day)' 
                  : '2. Enter Sales Report Month'}
              </label>
              {reportType === 'daily' ? (
                <div className="relative max-w-xs">
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={e => { setSelectedDate(e.target.value); setErrorMessage(''); }}
                    onClick={e => e.currentTarget.showPicker()}
                    className="w-full px-4 py-2.5 bg-[#0a0e1a] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              ) : (
                <div className="relative max-w-xs">
                  <input
                    type="month"
                    required
                    value={selectedMonth}
                    onChange={e => { setSelectedMonth(e.target.value); setErrorMessage(''); }}
                    onClick={e => e.currentTarget.showPicker()}
                    className="w-full px-4 py-2.5 bg-[#0a0e1a] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Drag Area */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                3. Ingest Document File
              </label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`
                  border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
                  ${dragActive 
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]' 
                    : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/5'}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.pdf"
                  className="hidden"
                />

                <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-7 w-7" />
                </div>
                
                <p className="text-sm font-bold text-gray-200">
                  Drag and drop your report sheet here
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  or <span className="text-indigo-400 font-semibold underline decoration-2 underline-offset-2">browse computer files</span>
                </p>
                <div className="mt-4 flex space-x-3 text-[10px] uppercase font-bold text-gray-400">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-md">Excel (.xlsx, .xls)</span>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-md">PDF (.pdf)</span>
                </div>
              </div>
            </div>

            {/* Selected File Card */}
            {file && (
              <div className="mt-6 flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl animate-slide-in">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-3 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
                    {file.name.split('.').pop() === 'pdf' ? <FileText className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-200 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB • {reportType === 'daily' ? 'Daily Collection' : 'Monthly Sales'}</p>
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  disabled={status === 'uploading' || status === 'parsing'}
                  className="p-1 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Ingest Progress Bar */}
            {(status === 'uploading' || status === 'parsing') && (
              <div className="mt-6 space-y-2 animate-slide-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-400 font-bold flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>{status === 'uploading' ? 'Uploading file archive...' : 'Invoking AI parsers...'}</span>
                  </span>
                  <span className="text-gray-300 font-bold">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions Button */}
            {file && status !== 'uploading' && status !== 'parsing' && status !== 'success' && (
              <button
                type="button"
                onClick={handleUploadSubmit}
                className="mt-6 flex items-center justify-center space-x-2 w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all duration-200 font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                <span>Trigger Ingestion Parser</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* Error Alert Display */}
            {status === 'error' && (
              <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start space-x-3 animate-slide-in">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Ingestion Blocked</h4>
                  <p className="text-xs mt-1 text-rose-300/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Ingestion Success Card */}
            {status === 'success' && result && (
              <div className="mt-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-4 animate-slide-in">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Report Logged Successfully</h4>
                    <p className="text-xs mt-1 text-emerald-300/90 leading-relaxed">
                      Sheet hash verified, data values mapped, and record successfully written to the database.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-bold text-gray-300 border-t border-emerald-500/10">
                  <div>
                    <span className="text-gray-500 block uppercase">Ingested Records</span>
                    <span className="text-white text-xs mt-1 block">{result.parsedCount} record(s) extracted</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase">Original File</span>
                    <span className="text-white text-xs mt-1 block truncate max-w-[200px]">{result.fileName}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={removeFile}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold transition-all duration-200 mt-2"
                  >
                    <span>Upload Another Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documentation Sidebar / Ingestion Rules */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#090e1b]/40">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4 flex items-center space-x-2">
              <Info className="h-4 w-4 text-indigo-400" />
              <span>Ingestion Guide</span>
            </h3>
            
            <ul className="space-y-4 text-xs text-gray-400">
              <li className="flex items-start space-x-2 leading-relaxed">
                <span className="text-indigo-400 font-bold mr-1">•</span>
                <span>The **Daily Collection Report** should match the POS-generated daily receipts structure, detailing UPI, credit card, coupons, and remittable cash totals.</span>
              </li>
              <li className="flex items-start space-x-2 leading-relaxed">
                <span className="text-indigo-400 font-bold mr-1">•</span>
                <span>The **Monthly Sales Report** extracts outlet-wide subsidy (maveli/coconut oil), non-subsidy (sabari, fssr, nm), and bulk sales details.</span>
              </li>
              <li className="flex items-start space-x-2 leading-relaxed">
                <span className="text-indigo-400 font-bold mr-1">•</span>
                <span>**Hash Collision Block**: Ingestion will automatically block files with identical hashes to prevent double-counting collections.</span>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase text-gray-300 mb-3">Download Sample Mocks</h4>
              <div className="space-y-2">
                <a 
                  href="/templates/sample-daily.xlsx" 
                  download
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-xs font-semibold border border-white/5"
                >
                  <span className="truncate">sample_daily_report.xlsx</span>
                  <Download className="h-4 w-4 text-indigo-400" />
                </a>
                <a 
                  href="/templates/sample-sales.xlsx" 
                  download
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-xs font-semibold border border-white/5"
                >
                  <span className="truncate">sample_monthly_sales.xlsx</span>
                  <Download className="h-4 w-4 text-indigo-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
