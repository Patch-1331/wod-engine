-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "phase" TEXT;

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN "cooldownCompletedAt" DATETIME;
ALTER TABLE "WorkoutSession" ADD COLUMN "warmupCompletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduleRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maxDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "patternCooldownDays" INTEGER NOT NULL DEFAULT 5,
    "warmupCooldownEnabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_ScheduleRule" ("id", "maxDaysPerWeek", "patternCooldownDays") SELECT "id", "maxDaysPerWeek", "patternCooldownDays" FROM "ScheduleRule";
DROP TABLE "ScheduleRule";
ALTER TABLE "new_ScheduleRule" RENAME TO "ScheduleRule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
