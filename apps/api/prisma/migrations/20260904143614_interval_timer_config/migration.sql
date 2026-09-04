-- AlterTable
ALTER TABLE "Wod" ADD COLUMN "intervalCount" INTEGER;
ALTER TABLE "Wod" ADD COLUMN "restSeconds" INTEGER;
ALTER TABLE "Wod" ADD COLUMN "workSeconds" INTEGER;

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN "intervalIndex" INTEGER;
ALTER TABLE "WorkoutSession" ADD COLUMN "intervalStartedAtSeconds" INTEGER;
