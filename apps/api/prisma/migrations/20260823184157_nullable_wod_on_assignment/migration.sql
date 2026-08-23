-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "wodId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    CONSTRAINT "DailyAssignment_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DailyAssignment" ("date", "id", "status", "wodId") SELECT "date", "id", "status", "wodId" FROM "DailyAssignment";
DROP TABLE "DailyAssignment";
ALTER TABLE "new_DailyAssignment" RENAME TO "DailyAssignment";
CREATE UNIQUE INDEX "DailyAssignment_date_key" ON "DailyAssignment"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
