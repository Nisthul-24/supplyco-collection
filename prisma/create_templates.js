const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function createTemplates() {
  console.log('Generating Excel templates...');

  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  const templatesDir = path.join(__dirname, '..', 'public', 'templates');
  
  [uploadDir, templatesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // ==========================================
  // 1. Generate sample-daily.xlsx template
  // ==========================================
  const dailyData = [
    ['DAILY COLLECTION OF MUKKAM SUPER MARKET'],
    ['Date Range: From 20-05-2026 To 24-05-2026'],
    [''],
    ['COLLECTION PARTICULARS', 'AMOUNT (RS.)'],
    ['MAVELI SUBSIDY', 46200.00],
    ['MAVELI FSSR', 16500.00],
    ['SABARI BP', 3200.00],
    ['SABARI TEA', 1950.00],
    ['SABARI CO OIL', 9800.00],
    ['MAVELI OTHERS', 1.28],
    ['NON MAVELI', 28170.00],
    ['ROUND OFF', 5.34],
    ['DISCOUNTS', 120.00],
    ['TOTAL COLLECTION (REGULAR)', 105820.00],
    ['RETAIL COLLECTION', 105820.00],
    ['BULK COLLECTION', 0.00],
    [''],
    ['PAYMENT CHANNEL PARTICULARS', 'AMOUNT (RS.)'],
    ['CREDIT CARD', 12000.00],
    ['UPI', 32450.00],
    ['COUPONS', 0.00],
    ['AMOUNT TO BE REMITTED', 61370.00]
  ];

  const dailySheet = xlsx.utils.aoa_to_sheet(dailyData);
  const dailyWorkbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(dailyWorkbook, dailySheet, 'Daily Collection');
  dailySheet['!cols'] = [{ wch: 35 }, { wch: 15 }];

  // Write to both paths
  xlsx.writeFile(dailyWorkbook, path.join(uploadDir, 'sample-daily.xlsx'));
  xlsx.writeFile(dailyWorkbook, path.join(templatesDir, 'sample-daily.xlsx'));
  console.log('Created sample-daily.xlsx templates');

  // ==========================================
  // 2. Generate sample-sales.xlsx template
  // ==========================================
  const salesData = [
    ['SALES COLLECTION DETAILS FOR THE MONTH OF MAY 2026'],
    [''],
    [
      'a', 'b', 'c', 'd=b+c', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 
      'l=e+f+g+h+i+j+k', 'm=d+l', 'n', 'o', 't=d+e+f+g+k'
    ],
    [
      'NAME OF OUTLET', 'MAVELI SUBSIDY', 'SUBSIDY COCONUT OIL', 'TOTAL SUBSIDY', 
      'SABARI SALES', 'OTHERS', 'FSSR SALES', 'BULK MAVELI', 'BULK SABARI', 
      'BULK NM', 'NON-MAVELI SALES', 'TOTAL NON-SUBSIDY', 'GRAND TOTAL', 
      'CB VALUE NON-MAVELI', 'OVERAGE NON-MAVELI', 'TOTAL WITHOUT BULK'
    ],
    [
      'SSM MUKKAM', 1312400.00, 154200.00, 1466600.00, 452100.00, 0.00, 
      318400.00, 0.00, 0.00, 0.00, 885600.00, 1656100.00, 3122700.00, 
      894300.00, 298500.00, 3122700.00
    ],
    [
      'MUKKAM SUPER MARKET', 1263447.74, 148800.00, 1412247.74, 435825.26, -53.00, 
      307704.42, 0.00, 0.00, 0.00, 849395.40, 1592872.08, 3005119.82, 
      868033.00, 290135.00, 3005119.82
    ],
    ['GRAND TOTAL', 2575847.74, 303000.00, 2878847.74, 887925.26, -53.00, 
      626108.84, 0.00, 0.00, 0.00, 1734995.40, 3248972.10, 6127819.82, 
      1762333.00, 588635.00, 6127819.82]
  ];

  const salesSheet = xlsx.utils.aoa_to_sheet(salesData);
  const salesWorkbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(salesWorkbook, salesSheet, 'Sales Report');
  
  // Write to both paths
  xlsx.writeFile(salesWorkbook, path.join(uploadDir, 'sample-sales.xlsx'));
  xlsx.writeFile(salesWorkbook, path.join(templatesDir, 'sample-sales.xlsx'));
  console.log('Created sample-sales.xlsx templates');

  console.log('Excel templates generation complete!');
}

createTemplates();
