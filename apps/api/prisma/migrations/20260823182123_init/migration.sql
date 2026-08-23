-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "needsBar" BOOLEAN NOT NULL DEFAULT false,
    "scalable" BOOLEAN NOT NULL DEFAULT false,
    "altExerciseId" TEXT,
    CONSTRAINT "Exercise_altExerciseId_fkey" FOREIGN KEY ("altExerciseId") REFERENCES "Exercise" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timeCapMinutes" INTEGER NOT NULL,
    "rounds" INTEGER,
    "isNamed" BOOLEAN NOT NULL DEFAULT false,
    "dominantPattern" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WodMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wodId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "reps" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "WodMovement_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WodMovement_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maxDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "patternCooldownDays" INTEGER NOT NULL DEFAULT 5
);

-- CreateTable
CREATE TABLE "DailyAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "wodId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    CONSTRAINT "DailyAssignment_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capSeconds" INTEGER NOT NULL,
    "roundSplits" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    CONSTRAINT "WorkoutSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DailyAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "resultValue" TEXT NOT NULL,
    "rpe" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DailyAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Wod_name_key" ON "Wod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAssignment_date_key" ON "DailyAssignment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_assignmentId_key" ON "WorkoutSession"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_assignmentId_key" ON "WorkoutLog"("assignmentId");
