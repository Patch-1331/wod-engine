-- Per-day movement substitution (WOD-5).
--
-- The athlete owns their level, and this is the write path: tapping a
-- movement on the Today plate before training swaps it for another rung on
-- the same line, or for its no-equipment alternative. The swap applies to
-- this day only -- the permanent rung change is confirmed afterwards, from
-- what these rows say was actually trained.
--
-- Keyed by WodMovement, not by exercise, so a WOD naming the same line twice
-- moves only the row that was tapped. The unique key makes a second swap of
-- the same movement a correction rather than a second row, so the write is a
-- plain upsert.
--
-- The composite (assignmentId, userId) foreign key is the one the rest of the
-- per-user models use: it makes a substitution claiming another user's
-- assignment unrepresentable rather than merely avoided by careful writes.

CREATE TABLE "AssignmentSubstitution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "wodMovementId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentSubstitution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssignmentSubstitution_assignmentId_wodMovementId_key" ON "AssignmentSubstitution"("assignmentId", "wodMovementId");

ALTER TABLE "AssignmentSubstitution" ADD CONSTRAINT "AssignmentSubstitution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentSubstitution" ADD CONSTRAINT "AssignmentSubstitution_assignmentId_userId_fkey" FOREIGN KEY ("assignmentId", "userId") REFERENCES "DailyAssignment"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentSubstitution" ADD CONSTRAINT "AssignmentSubstitution_wodMovementId_fkey" FOREIGN KEY ("wodMovementId") REFERENCES "WodMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssignmentSubstitution" ADD CONSTRAINT "AssignmentSubstitution_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
