-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" DATETIME NOT NULL,
    "outletName" TEXT NOT NULL,
    "totalCollection" REAL NOT NULL,
    "paymentDetails" TEXT NOT NULL,
    "rawTextData" TEXT,
    "uploadedFileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyCollection_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyCollection" ("createdAt", "fileHash", "fileName", "id", "outletName", "paymentDetails", "rawTextData", "reportDate", "totalCollection", "uploadedFileUrl") SELECT "createdAt", "fileHash", "fileName", "id", "outletName", "paymentDetails", "rawTextData", "reportDate", "totalCollection", "uploadedFileUrl" FROM "DailyCollection";
DROP TABLE "DailyCollection";
ALTER TABLE "new_DailyCollection" RENAME TO "DailyCollection";
CREATE UNIQUE INDEX "DailyCollection_fileHash_key" ON "DailyCollection"("fileHash");
CREATE TABLE "new_SalesReport" (
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
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesReport_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SalesReport" ("bulkSales", "createdAt", "extraDetails", "fileHash", "fileName", "grandTotal", "id", "nonSubsidySales", "outletName", "reportMonth", "subsidySales", "uploadedFileUrl") SELECT "bulkSales", "createdAt", "extraDetails", "fileHash", "fileName", "grandTotal", "id", "nonSubsidySales", "outletName", "reportMonth", "subsidySales", "uploadedFileUrl" FROM "SalesReport";
DROP TABLE "SalesReport";
ALTER TABLE "new_SalesReport" RENAME TO "SalesReport";
CREATE UNIQUE INDEX "SalesReport_fileHash_key" ON "SalesReport"("fileHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
