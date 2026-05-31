import * as xlsx from 'xlsx';
import { PDFParse } from 'pdf-parse';

export interface DailyCollectionData {
  reportDate: Date;
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
}

/**
 * Extracts a numeric value from a cells row, returning 0 if not found/invalid
 */
function extractNumericValue(row: any[]): number {
  for (let i = row.length - 1; i >= 1; i--) {
    const val = row[i];
    if (val !== undefined && val !== null && val !== '') {
      const parsed = parseFloat(String(val).replace(/,/g, '').trim());
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

/**
 * Helper to clean and parse date string in Format DD-MM-YYYY
 */
function parseDateString(dateStr: string): Date {
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date();
}

/**
 * Parses an Excel buffer containing a Daily Collection Report
 */
export function parseDailyCollectionExcel(buffer: Buffer): DailyCollectionData {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert worksheet to 2D array of raw values to handle spacing dynamically
  const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  let outletName = 'UNKNOWN OUTLET';
  let reportDate = new Date();
  
  // Create default payment breakdown structure
  const details = {
    maveliSubsidy: 0,
    maveliFssr: 0,
    maveliSabariBp: 0,
    maveliSabariTea: 0,
    sabariCoOil: 0,
    maveliOthers: 0,
    nonMaveli: 0,
    medical: 0,
    nonMedical: 0,
    petrolDiesel: 0,
    lpg: 0,
    others: 0,
    roundOff: 0,
    discounts: 0,
    retailCollection: 0,
    bulkCollection: 0,
    creditCard: 0,
    upi: 0,
    coupons: 0,
    amountToRemit: 0,
  };
  
  let totalCollection = 0;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    
    // Concat all cell string representations in this row to scan for context anchors
    const rowString = row.map(c => String(c || '')).join(' ');
    
    // 1. Extract Outlet Name and Date Range
    if (rowString.toLowerCase().includes('daily collection of')) {
      const matchOutlet = rowString.match(/daily collection of\s+(.+?)(?:\(|\bFrom\b|\d{5,})/i);
      if (matchOutlet && matchOutlet[1]) {
        outletName = matchOutlet[1].trim().replace(/[\(\)]/g, '');
      }
    }
    
    // Extract dates
    if (rowString.toLowerCase().includes('from') && rowString.toLowerCase().includes('to')) {
      const dateMatches = rowString.match(/(\d{2}-\d{2}-\d{4})/g);
      if (dateMatches && dateMatches.length > 0) {
        reportDate = parseDateString(dateMatches[0]);
      }
    } else if (rowString.toLowerCase().includes('date range:')) {
      const dateMatches = rowString.match(/(\d{2}-\d{2}-\d{4})/g);
      if (dateMatches && dateMatches.length > 0) {
        reportDate = parseDateString(dateMatches[0]);
      }
    }
    
    // 2. Extract values based on row content search
    const colA = String(row[0] || '').toLowerCase().trim();
    const fullColText = rowString.toLowerCase();
    
    if (colA.includes('maveli subsidy') || (colA.includes('maveli') && colA.includes('subsidy'))) {
      details.maveliSubsidy = extractNumericValue(row);
    } else if (colA.includes('maveli fssr') || colA.includes('fssr')) {
      // Avoid matching Sales Report's FSSR, this is local daily collection
      details.maveliFssr = extractNumericValue(row);
    } else if (colA.includes('sabari bp') || (colA.includes('maveli') && colA.includes('bp'))) {
      details.maveliSabariBp = extractNumericValue(row);
    } else if (colA.includes('sabari tea')) {
      details.maveliSabariTea = extractNumericValue(row);
    } else if (colA.includes('sabari co oil') || colA.includes('sunsidy/non subsidy') || colA.includes('subsidy coc.oil')) {
      details.sabariCoOil = extractNumericValue(row);
    } else if (colA.includes('maveli others')) {
      details.maveliOthers = extractNumericValue(row);
    } else if (colA.includes('(b).non maveli') || colA === 'non maveli') {
      details.nonMaveli = extractNumericValue(row);
    } else if (colA.includes('(c).medical') || colA === 'medical') {
      details.medical = extractNumericValue(row);
    } else if (colA.includes('(d).non medical') || colA === 'non medical') {
      details.nonMedical = extractNumericValue(row);
    } else if (colA.includes('petrol/diesel') || colA.includes('petro products')) {
      details.petrolDiesel = extractNumericValue(row);
    } else if (colA.includes('lpg')) {
      details.lpg = extractNumericValue(row);
    } else if (colA.includes('(e).others')) {
      details.others = extractNumericValue(row);
    } else if (colA.includes('round off')) {
      details.roundOff = extractNumericValue(row);
    } else if (colA.includes('discounts') || colA.includes('staff/ kit discounts')) {
      details.discounts = extractNumericValue(row);
    } else if (colA.includes('total collection(') || colA.includes('total collection (')) {
      totalCollection = extractNumericValue(row);
    } else if (colA.includes('retail collection')) {
      details.retailCollection = extractNumericValue(row);
    } else if (colA.includes('bulk collection')) {
      details.bulkCollection = extractNumericValue(row);
    } else if (colA.includes('credit card')) {
      details.creditCard = extractNumericValue(row);
    } else if (colA.includes('upi') || colA.includes('through upi')) {
      details.upi = extractNumericValue(row);
    } else if (colA.includes('coupons') || colA.includes('through coupons')) {
      details.coupons = extractNumericValue(row);
    } else if (colA.includes('amount to be remitted') || colA.includes('remitted(')) {
      details.amountToRemit = extractNumericValue(row);
    }
  }
  
  // Fallback calculations if total collection wasn't parsed correctly
  if (totalCollection === 0) {
    totalCollection = details.maveliSubsidy + details.maveliFssr + details.maveliSabariBp + details.maveliSabariTea + details.sabariCoOil + details.maveliOthers + details.nonMaveli + details.medical + details.nonMedical + details.others + details.roundOff - details.discounts;
  }
  
  if (details.amountToRemit === 0) {
    // Amount to be remitted: Total collection - credit card - upi - coupons - credit sales
    details.amountToRemit = totalCollection - details.creditCard - details.upi - details.coupons;
  }

  return {
    reportDate,
    outletName: outletName || 'UNKNOWN OUTLET',
    totalCollection,
    paymentDetails: details
  };
}

/**
 * Parses a PDF buffer containing a Daily Collection Report using text scraping
 */
export async function parseDailyCollectionPDF(buffer: Buffer): Promise<DailyCollectionData> {
  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  const text = pdfData.text;
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let outletName = 'UNKNOWN OUTLET';
  let reportDate = new Date();
  
  const details = {
    maveliSubsidy: 0,
    maveliFssr: 0,
    maveliSabariBp: 0,
    maveliSabariTea: 0,
    sabariCoOil: 0,
    maveliOthers: 0,
    nonMaveli: 0,
    medical: 0,
    nonMedical: 0,
    petrolDiesel: 0,
    lpg: 0,
    others: 0,
    roundOff: 0,
    discounts: 0,
    retailCollection: 0,
    bulkCollection: 0,
    creditCard: 0,
    upi: 0,
    coupons: 0,
    amountToRemit: 0,
  };
  
  let totalCollection = 0;

  // Helper to extract numbers from end of line string
  const getLineNumber = (line: string): number => {
    const match = line.match(/[\d\.\,-]+$/);
    if (match) {
      const parsed = parseFloat(match[0].replace(/,/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('daily collection of')) {
      const match = line.match(/daily collection of\s+(.+?)(?:\(|\bFrom\b|\d{5,})/i);
      if (match) outletName = match[1].trim().replace(/[\(\)]/g, '');
    }
    
    if (lowerLine.includes('from') && lowerLine.includes('to')) {
      const dateMatches = line.match(/(\d{2}-\d{2}-\d{4})/g);
      if (dateMatches && dateMatches.length > 0) {
        reportDate = parseDateString(dateMatches[0]);
      }
    } else if (lowerLine.includes('date range:')) {
      const dateMatches = line.match(/(\d{2}-\d{2}-\d{4})/g);
      if (dateMatches && dateMatches.length > 0) {
        reportDate = parseDateString(dateMatches[0]);
      }
    }
    
    if (lowerLine.includes('maveli subsidy') || (lowerLine.includes('maveli') && lowerLine.includes('subsidy'))) {
      details.maveliSubsidy = getLineNumber(line);
    } else if (lowerLine.includes('maveli fssr') || lowerLine.includes('fssr')) {
      details.maveliFssr = getLineNumber(line);
    } else if (lowerLine.includes('sabari bp') || (lowerLine.includes('maveli') && lowerLine.includes('bp'))) {
      details.maveliSabariBp = getLineNumber(line);
    } else if (lowerLine.includes('sabari tea')) {
      details.maveliSabariTea = getLineNumber(line);
    } else if (lowerLine.includes('sabari co oil') || lowerLine.includes('sunsidy/non subsidy')) {
      details.sabariCoOil = getLineNumber(line);
    } else if (lowerLine.includes('maveli others')) {
      details.maveliOthers = getLineNumber(line);
    } else if (lowerLine.includes('(b).non maveli') || lowerLine === 'non maveli') {
      details.nonMaveli = getLineNumber(line);
    } else if (lowerLine.includes('(c).medical')) {
      details.medical = getLineNumber(line);
    } else if (lowerLine.includes('(d).non medical')) {
      details.nonMedical = getLineNumber(line);
    } else if (lowerLine.includes('petrol/diesel')) {
      details.petrolDiesel = getLineNumber(line);
    } else if (lowerLine.includes('lpg')) {
      details.lpg = getLineNumber(line);
    } else if (lowerLine.includes('(e).others')) {
      details.others = getLineNumber(line);
    } else if (lowerLine.includes('round off')) {
      details.roundOff = getLineNumber(line);
    } else if (lowerLine.includes('discounts') || lowerLine.includes('staff/ kit discounts')) {
      details.discounts = getLineNumber(line);
    } else if (lowerLine.includes('total collection(') || lowerLine.includes('total collection (')) {
      totalCollection = getLineNumber(line);
    } else if (lowerLine.includes('retail collection')) {
      details.retailCollection = getLineNumber(line);
    } else if (lowerLine.includes('bulk collection')) {
      details.bulkCollection = getLineNumber(line);
    } else if (lowerLine.includes('credit card')) {
      details.creditCard = getLineNumber(line);
    } else if (lowerLine.includes('upi') || lowerLine.includes('through upi')) {
      details.upi = getLineNumber(line);
    } else if (lowerLine.includes('coupons')) {
      details.coupons = getLineNumber(line);
    } else if (lowerLine.includes('amount to be remitted')) {
      details.amountToRemit = getLineNumber(line);
    }
  }

  if (totalCollection === 0) {
    totalCollection = details.maveliSubsidy + details.maveliFssr + details.maveliSabariBp + details.maveliSabariTea + details.sabariCoOil + details.maveliOthers + details.nonMaveli + details.medical + details.nonMedical + details.others + details.roundOff - details.discounts;
  }
  
  if (details.amountToRemit === 0) {
    details.amountToRemit = totalCollection - details.creditCard - details.upi - details.coupons;
  }

  return {
    reportDate,
    outletName: outletName || 'UNKNOWN OUTLET',
    totalCollection,
    paymentDetails: details
  };
}
