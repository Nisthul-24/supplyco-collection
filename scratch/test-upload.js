const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = 'smart-shop-secret-super-secure-key-10928374';
const COOKIE_NAME = 'smart_shop_auth_token';

const mockUser = {
  id: '3eceed28-2a9d-456c-b889-a797f6436e3a', // Seeded admin ID
  email: 'admin@shop.com',
  role: 'ADMIN',
  name: 'Adithya Varma (Admin)'
};

const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' });

async function runTest() {
  const filePath = path.join(__dirname, '..', 'public', 'templates', 'sample-daily.xlsx');
  console.log('Reading file from:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('File does not exist!');
    return;
  }
  
  let fileBuffer = fs.readFileSync(filePath);
  // Append a random timestamp byte so the hash is unique and doesn't trigger duplicate check
  const randomSuffix = Buffer.from(`\n// Test unique hash: ${Date.now()}`);
  fileBuffer = Buffer.concat([fileBuffer, randomSuffix]);
  
  // Use Node.js built-in Fetch & FormData
  const formData = new FormData();
  const fileBlob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  formData.append('file', fileBlob, 'sample-daily.xlsx');
  formData.append('reportType', 'daily');
  formData.append('reportDate', '2026-06-01');

  console.log('Sending upload request to http://localhost:3000/api/upload...');
  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': `${COOKIE_NAME}=${token}`
      }
    });
    
    console.log('Response status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

runTest();
