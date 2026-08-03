-- CreateTable
CREATE TABLE "BackupLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "recordCount" INTEGER,
    "recordsDeleted" INTEGER,
    "fileName" TEXT,
    "sourceExportDate" DATETIME,
    "sourceVersion" TEXT,
    "snapshotFile" TEXT,
    "actor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "BackupLog_type_createdAt_idx" ON "BackupLog"("type", "createdAt");
