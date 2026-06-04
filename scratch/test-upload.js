const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = "smart-shop-secret-super-secure-key-10928374";
const COOKIE_NAME = 'smart_shop_auth_token';

async function run() {
  try {
    // 1. Generate auth token for the actual user SSM MUKKAM
    const token = jwt.sign({
      id: '27565ac7-4615-4e75-afc0-d7f06c63c626',
      email: 'unnikrishnanpk917@gmail.com',
      role: 'SHOP',
      name: 'SSM MUKKAM'
    }, JWT_SECRET, { expiresIn: '7d' });

    const cookie = `${COOKIE_NAME}=${token}`;
    console.log('Generated cookie:', cookie);

    // 2. Read the sales excel file
    const filePath = path.join(__dirname, '..', 'public', 'templates', 'sample-sales.xlsx');
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const formData = new FormData();
    formData.append('file', blob, 'sample-sales.xlsx');
    formData.append('reportType', 'sales');
    formData.append('reportMonth', '2026-06');

    console.log('Uploading sales file with signed cookie...');
    const uploadRes = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Cookie': cookie,
      },
      body: formData,
    });

    console.log('Upload response status:', uploadRes.status);
    const text = await uploadRes.text();
    console.log('Upload response text:', text);

  } catch (err) {
    console.error('Error running test script:', err);
  }
}

run();
