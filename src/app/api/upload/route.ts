import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateFileHash } from '@/lib/hash';
import { parseDailyCollectionExcel, parseDailyCollectionPDF } from '@/lib/parsers/dailyCollectionParser';
import { parseSalesReportExcel, parseSalesReportPDF } from '@/lib/parsers/salesReportParser';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Parse Multipart Form
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const reportType = formData.get('reportType') as string; // "daily" or "sales"
    const reportDateOverride = formData.get('reportDate') as string | null;
    const reportMonthOverride = formData.get('reportMonth') as string | null;
    
    if (!file || !reportType) {
      return NextResponse.json({ error: 'File and reportType are required' }, { status: 400 });
    }
    
    // Validate file type
    const originalName = file.name;
    const extension = path.extname(originalName).toLowerCase();
    if (!['.xlsx', '.xls', '.pdf'].includes(extension)) {
      return NextResponse.json({ error: 'Invalid file format. Only Excel (.xlsx, .xls) and PDF (.pdf) are allowed.' }, { status: 400 });
    }
    
    // 3. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 4. Check for Duplicate Uploads via Hash
    const fileHash = calculateFileHash(buffer);
    
    if (reportType === 'daily') {
      const duplicate = await prisma.dailyCollection.findUnique({ where: { fileHash } });
      if (duplicate) {
        return NextResponse.json({ error: 'Duplicate file upload! This daily collection report has already been uploaded.' }, { status: 400 });
      }
    } else if (reportType === 'sales') {
      const duplicate = await prisma.salesReport.findFirst({ where: { fileHash } });
      if (duplicate) {
        return NextResponse.json({ error: 'Duplicate file upload! This monthly sales report has already been uploaded.' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid reportType. Must be "daily" or "sales".' }, { status: 400 });
    }
    
    // 5. Save File Locally
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}${extension}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);
    const uploadedFileUrl = `/uploads/${uniqueFileName}`;
    
    // 6. Invoke Appropriate Parser
    let parsedCount = 0;
    
    if (reportType === 'daily') {
      let parsedData;
      if (extension === '.pdf') {
        parsedData = await parseDailyCollectionPDF(buffer);
      } else {
        parsedData = parseDailyCollectionExcel(buffer);
      }
      
      const finalReportDate = reportDateOverride ? new Date(reportDateOverride) : parsedData.reportDate;
      
      // Save parsed data to DB
      await prisma.dailyCollection.create({
        data: {
          reportDate: finalReportDate,
          outletName: parsedData.outletName,
          totalCollection: parsedData.totalCollection,
          paymentDetails: JSON.stringify(parsedData.paymentDetails),
          rawTextData: `Outlet: ${parsedData.outletName}, Date: ${finalReportDate.toISOString()}, Total: ${parsedData.totalCollection}`,
          uploadedFileUrl,
          fileName: originalName,
          fileHash,
          uploadedById: user.id
        }
      });
      parsedCount = 1;
      
    } else {
      // Sales Report Ingestion
      let parsedReports = [];
      if (extension === '.pdf') {
        parsedReports = await parseSalesReportPDF(buffer);
      } else {
        parsedReports = parseSalesReportExcel(buffer);
      }
      
      if (parsedReports.length === 0) {
        // Clean up saved file if parsing failed completely
        await fs.unlink(filePath).catch(() => {});
        return NextResponse.json({ error: 'Failed to parse sales report. Ensure the file has valid structure.' }, { status: 400 });
      }
      
      // Save all parsed outlet records to DB
      for (const report of parsedReports) {
        const finalReportMonth = reportMonthOverride || report.reportMonth;
        
        await prisma.salesReport.create({
          data: {
            reportMonth: finalReportMonth,
            outletName: report.outletName,
            subsidySales: report.subsidySales,
            nonSubsidySales: report.nonSubsidySales,
            bulkSales: report.bulkSales,
            grandTotal: report.grandTotal,
            extraDetails: JSON.stringify(report.extraDetails),
            uploadedFileUrl,
            fileName: originalName,
            fileHash,
            uploadedById: user.id
          }
        });
      }
      parsedCount = parsedReports.length;
    }
    
    return NextResponse.json({
      message: 'File uploaded and parsed successfully',
      reportType,
      parsedCount,
      fileName: originalName,
      fileHash
    });
    
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during upload' }, { status: 500 });
  }
}
