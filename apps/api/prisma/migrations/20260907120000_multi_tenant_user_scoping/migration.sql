-- Multi-tenant scoping: every per-user model gains a userId.
--
-- The new columns are NOT NULL with no default, which Postgres cannot add to
-- a table that already holds rows. The only rows that exist at this point are
-- seed defaults (8 SkillLevel rows at rung 0, one ScheduleRule with default
-- values) plus any DailyAssignment generated while smoke-testing /today. None
-- of it is user data worth preserving, and per-user rows are recreated by
-- first-sign-in provisioning, so this clears them rather than backfilling to
-- a placeholder owner that would leave unreachable rows behind.
--
-- Children first, to respect the foreign keys.
DELETE FROM "WorkoutLog";
DELETE FROM "WorkoutSession";
DELETE FROM "DailyAssignment";
DELETE FROM "SkillLevel";
DELETE FROM "ScheduleRule";

-- DropForeignKey
ALTER TABLE "WorkoutSession" DROP CONSTRAINT "WorkoutSession_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutLog" DROP CONSTRAINT "WorkoutLog_assignmentId_fkey";

-- DropIndex
DROP INDEX "SkillLevel_line_key";

-- DropIndex
DROP INDEX "DailyAssignment_date_key";

-- AlterTable
ALTER TABLE "SkillLevel" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleRule" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DailyAssignment" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutLog" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SkillLevel_userId_line_key" ON "SkillLevel"("userId", "line");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRule_userId_key" ON "ScheduleRule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAssignment_userId_date_key" ON "DailyAssignment"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAssignment_id_userId_key" ON "DailyAssignment"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_assignmentId_userId_key" ON "WorkoutSession"("assignmentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_assignmentId_userId_key" ON "WorkoutLog"("assignmentId", "userId");

-- AddForeignKey
ALTER TABLE "SkillLevel" ADD CONSTRAINT "SkillLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAssignment" ADD CONSTRAINT "DailyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_assignmentId_userId_fkey" FOREIGN KEY ("assignmentId", "userId") REFERENCES "DailyAssignment"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_assignmentId_userId_fkey" FOREIGN KEY ("assignmentId", "userId") REFERENCES "DailyAssignment"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

