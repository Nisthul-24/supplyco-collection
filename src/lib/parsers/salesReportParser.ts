import * as xlsx from 'xlsx';
import { PDFParse } from 'pdf-parse';

export interface SalesReportData {
  reportMonth: string; // Format: "YYYY-MM"
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
}

const MONTH_MAP: Record<string, string> = {
  january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06',
  jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12'
};

/**
 * Extracts a month in "YYYY-MM" format from a report header string
 */
function extractMonthFromHeader(text: string): string {
  const clean = text.toLowerCase();
  
  // Try regex matching e.g., "MONTH APRIL --2026" or "MONTH APRIL 2026"
  const monthMatch = clean.match(/month\s+(\w+)\s*(?:--|-|\s)\s*(\d{4})/i);
  if (monthMatch && monthMatch[1] && monthMatch[2]) {
    const monthName = monthMatch[1];
    const year = monthMatch[2];
    const monthNum = MONTH_MAP[monthName] || '01';
    return `${year}-${monthNum}`;
  }
  
  // Fallback to current year-month
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/**
 * Safe parser for cell values
 */
function parseCellNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const parsed = parseFloat(String(val).replace(/,/g, '').trim());
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses an Excel buffer containing a Monthly Sales Collection Report
 */
export function parseSalesReportExcel(buffer: Buffer): SalesReportData[] {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  let reportMonth = '';
  let headerRowIndex = -1;
  let formulaRowIndex = -1;
  
  // Map of formula letter to column index
  const colIndices: Record<string, number> = {};

  // 1. Scan rows to find the report month and locate headers
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    
    const rowString = row.map(c => String(c || '')).join(' ');
    
    // Extract report month from header
    if (rowString.toLowerCase().includes('sales collection details') && rowString.toLowerCase().includes('month')) {
      reportMonth = extractMonthFromHeader(rowString);
    }
    
    // Look for the formula row: a row containing 'a', 'b', 'c', 'd=b+c' or similar formula labels
    const rowJoined = row.map(c => String(c || '').toLowerCase().trim());
    if (rowJoined.includes('a') && rowJoined.includes('b') && rowJoined.includes('c')) {
      formulaRowIndex = r;
      
      // Build dynamic index mapping
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').toLowerCase().trim();
        if (val) {
          colIndices[val] = c;
        }
      }
    }
    
    // Look for NAME OF OUTLET header
    if (rowJoined.includes('name of outlet') || rowString.toLowerCase().includes('name of outlet')) {
      headerRowIndex = r;
    }
  }

  // Fallbacks if headers weren't found
  if (reportMonth === '') {
    const now = new Date();
    reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  const startRow = Math.max(formulaRowIndex, headerRowIndex) + 1;
  if (startRow <= 0 || !colIndices['a']) {
    // If formula row wasn't found, use hardcoded standard indexes as safety fallback
    colIndices['a'] = 0;
    colIndices['b'] = 1;
    colIndices['c'] = 2;
    colIndices['d=b+c'] = 3;
    colIndices['e'] = 4;
    colIndices['f'] = 5;
    colIndices['g'] = 6;
    colIndices['h'] = 7;
    colIndices['i'] = 8;
    colIndices['j'] = 9;
    colIndices['k'] = 10;
    colIndices['l=e+f+g+h+i+j+k'] = 11;
    colIndices['m=d+l'] = 12;
    colIndices['n'] = 13;
    colIndices['o'] = 14;
    colIndices['t=d+e+f+g+k'] = 15;
  }

  const reports: SalesReportData[] = [];

  // Parse successive rows starting after headers
  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    
    const outletNameVal = String(row[colIndices['a'] || 0] || '').trim();
    
    // Stop scanning if we hit totals row or empty rows
    if (outletNameVal === '' || outletNameVal.toLowerCase().startsWith('total') || outletNameVal.toLowerCase().includes('grand total')) {
      continue;
    }
    
    // Resolve dynamic indexes for columns
    const getVal = (label: string): number => {
      // Find the index corresponding to the label
      let idx = -1;
      for (const k in colIndices) {
        if (k === label || k.startsWith(label + '=') || k.startsWith(label + ' =')) {
          idx = colIndices[k];
          break;
        }
      }
      return idx !== -1 ? parseCellNumber(row[idx]) : 0;
    };

    const subsidyMaveli = getVal('b');
    const subsidyCocOil = getVal('c');
    const totalSubsidySales = getVal('d') || (subsidyMaveli + subsidyCocOil);
    
    const sabariSales = getVal('e');
    const others = getVal('f');
    const fssr = getVal('g');
    const bulkMaveli = getVal('h');
    const bulkSabari = getVal('i');
    const bulkNM = getVal('j');
    const nonMaveliSales = getVal('k');
    
    const totalNonSubsidySales = getVal('l') || (sabariSales + others + fssr + bulkMaveli + bulkSabari + bulkNM + nonMaveliSales);
    const grandTotal = getVal('m') || (totalSubsidySales + totalNonSubsidySales);
    
    const cbValueNonMaveli = getVal('n');
    const overageNonMaveli = getVal('o');
    const totalWithoutBulk = getVal('t') || (totalSubsidySales + sabariSales + others + fssr + nonMaveliSales);

    reports.push({
      reportMonth,
      outletName: outletNameVal,
      subsidySales: totalSubsidySales,
      nonSubsidySales: totalNonSubsidySales,
      bulkSales: bulkMaveli + bulkSabari + bulkNM,
      grandTotal,
      extraDetails: {
        subsidyMaveli,
        subsidyCocOil,
        sabariSales,
        others,
        fssr,
        bulkMaveli,
        bulkSabari,
        bulkNM,
        nonMaveliSales,
        cbValueNonMaveli,
        overageNonMaveli,
        totalWithoutBulk
      }
    });
  }

  return reports;
}

/**
 * Parses a PDF buffer containing Monthly Sales Collection Reports using text scanning
 */
export async function parseSalesReportPDF(buffer: Buffer): Promise<SalesReportData[]> {
  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  const text = pdfData.text;
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let reportMonth = '';
  const reports: SalesReportData[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('sales collection details') && line.toLowerCase().includes('month')) {
      reportMonth = extractMonthFromHeader(line);
      break;
    }
  }
  
  if (reportMonth === '') {
    const now = new Date();
    reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // PDF Text parser: search for rows of values
  // In a text-based PDF dump of SSM sales, each row might look like:
  // "SSM MUKKAM 1263447.74 148800 1412247.7 435825.26 -53 307704.42 0 0 0 849395.40 1592872 3005120 868033 290135 3005120.00"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\s+/);
    
    // A valid row must start with alphabetical letters (outlet name) and contain many numeric parts
    if (parts.length >= 8) {
      // Find where numbers start
      let numberStartIndex = -1;
      for (let p = 0; p < parts.length; p++) {
        const cleanVal = parts[p].replace(/,/g, '');
        if (!isNaN(parseFloat(cleanVal)) && (cleanVal.includes('.') || cleanVal === '0')) {
          numberStartIndex = p;
          break;
        }
      }
      
      if (numberStartIndex > 0 && parts.length - numberStartIndex >= 10) {
        const outletName = parts.slice(0, numberStartIndex).join(' ');
        
        if (outletName.toLowerCase().startsWith('total') || outletName.toLowerCase().includes('grand total')) {
          continue;
        }
        
        const nums = parts.slice(numberStartIndex).map(n => parseCellNumber(n));
        
        const subsidyMaveli = nums[0] || 0;
        const subsidyCocOil = nums[1] || 0;
        const totalSubsidySales = nums[2] || (subsidyMaveli + subsidyCocOil);
        
        const sabariSales = nums[3] || 0;
        const others = nums[4] || 0;
        const fssr = nums[5] || 0;
        
        // Handle bulk sales columns (some sheets have 3, some have none)
        let bulkMaveli = 0, bulkSabari = 0, bulkNM = 0;
        let nonMaveliSales = 0;
        let totalNonSubsidySales = 0;
        let grandTotal = 0;
        let cbValueNonMaveli = 0;
        let overageNonMaveli = 0;
        let totalWithoutBulk = 0;
        
        if (nums.length >= 15) {
          bulkMaveli = nums[6] || 0;
          bulkSabari = nums[7] || 0;
          bulkNM = nums[8] || 0;
          nonMaveliSales = nums[9] || 0;
          totalNonSubsidySales = nums[10] || 0;
          grandTotal = nums[11] || 0;
          cbValueNonMaveli = nums[12] || 0;
          overageNonMaveli = nums[13] || 0;
          totalWithoutBulk = nums[14] || 0;
        } else {
          // Gaps in PDF columns
          nonMaveliSales = nums[6] || 0;
          totalNonSubsidySales = nums[7] || 0;
          grandTotal = nums[8] || 0;
          totalWithoutBulk = grandTotal;
        }

        reports.push({
          reportMonth,
          outletName,
          subsidySales: totalSubsidySales,
          nonSubsidySales: totalNonSubsidySales,
          bulkSales: bulkMaveli + bulkSabari + bulkNM,
          grandTotal,
          extraDetails: {
            subsidyMaveli,
            subsidyCocOil,
            sabariSales,
            others,
            fssr,
            bulkMaveli,
            bulkSabari,
            bulkNM,
            nonMaveliSales,
            cbValueNonMaveli,
            overageNonMaveli,
            totalWithoutBulk
          }
        });
      }
    }
  }

  return reports;
}
