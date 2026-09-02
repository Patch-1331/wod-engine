-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pattern" TEXT,
    "needsBar" BOOLEAN NOT NULL DEFAULT false,
    "scalable" BOOLEAN NOT NULL DEFAULT false,
    "unit" TEXT NOT NULL DEFAULT 'reps',
    "line" TEXT,
    "rung" INTEGER,
    "phase" TEXT,
    "altExerciseId" TEXT,
    CONSTRAINT "Exercise_altExerciseId_fkey" FOREIGN KEY ("altExerciseId") REFERENCES "Exercise" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("altExerciseId", "id", "line", "name", "needsBar", "pattern", "phase", "rung", "scalable", "unit") SELECT "altExerciseId", "id", "line", "name", "needsBar", "pattern", "phase", "rung", "scalable", "unit" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
