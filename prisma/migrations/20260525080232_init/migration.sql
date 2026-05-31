-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DailyCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" DATETIME NOT NULL,
    "outletName" TEXT NOT NULL,
    "totalCollection" REAL NOT NULL,
    "paymentDetails" TEXT NOT NULL,
    "rawTextData" TEXT,
    "uploadedFileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SalesReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportMonth" TEXT NOT NULL,
    "outletName" TEXT NOT NULL,
    "subsidySales" REAL NOT NULL,
    "nonSubsidySales" REAL NOT NULL,
    "bulkSales" REAL NOT NULL,
    "grandTotal" REAL NOT NULL,
    "extraDetails" TEXT NOT NULL,
    "uploadedFileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCollection_fileHash_key" ON "DailyCollection"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReport_fileHash_key" ON "SalesReport"("fileHash");
