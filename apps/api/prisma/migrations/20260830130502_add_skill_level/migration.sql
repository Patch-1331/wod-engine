-- CreateTable
CREATE TABLE "SkillLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "line" TEXT NOT NULL,
    "rung" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillLevel_line_key" ON "SkillLevel"("line");
