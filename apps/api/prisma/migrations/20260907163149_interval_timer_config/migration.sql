-- AlterTable
ALTER TABLE "Wod" ADD COLUMN     "intervalCount" INTEGER,
ADD COLUMN     "restSeconds" INTEGER,
ADD COLUMN     "workSeconds" INTEGER;

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "intervalIndex" INTEGER,
ADD COLUMN     "intervalStartedAtSeconds" INTEGER;
