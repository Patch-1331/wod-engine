-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT,
    "needsBar" BOOLEAN NOT NULL DEFAULT false,
    "scalable" BOOLEAN NOT NULL DEFAULT false,
    "unit" TEXT NOT NULL DEFAULT 'reps',
    "line" TEXT,
    "rung" INTEGER,
    "phase" TEXT,
    "altExerciseId" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillLevel" (
    "id" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "rung" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastChange" TEXT,

    CONSTRAINT "SkillLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timeCapMinutes" INTEGER NOT NULL,
    "rounds" INTEGER,
    "isNamed" BOOLEAN NOT NULL DEFAULT false,
    "dominantPattern" TEXT NOT NULL,

    CONSTRAINT "Wod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WodMovement" (
    "id" TEXT NOT NULL,
    "wodId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "reps" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "WodMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRule" (
    "id" TEXT NOT NULL,
    "maxDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "patternCooldownDays" INTEGER NOT NULL DEFAULT 5,
    "warmupCooldownEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAssignment" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "wodId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',

    CONSTRAINT "DailyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capSeconds" INTEGER NOT NULL,
    "roundSplits" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "finishedAtSeconds" INTEGER,
    "roundSplitCount" INTEGER,
    "warmupCompletedAt" TIMESTAMP(3),
    "cooldownCompletedAt" TIMESTAMP(3),

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "resultValue" TEXT NOT NULL,
    "rpe" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillLevel_line_key" ON "SkillLevel"("line");

-- CreateIndex
CREATE UNIQUE INDEX "Wod_name_key" ON "Wod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAssignment_date_key" ON "DailyAssignment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_assignmentId_key" ON "WorkoutSession"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_assignmentId_key" ON "WorkoutLog"("assignmentId");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_altExerciseId_fkey" FOREIGN KEY ("altExerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WodMovement" ADD CONSTRAINT "WodMovement_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WodMovement" ADD CONSTRAINT "WodMovement_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAssignment" ADD CONSTRAINT "DailyAssignment_wodId_fkey" FOREIGN KEY ("wodId") REFERENCES "Wod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DailyAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DailyAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

