-- `roundSplits` held a JSON-encoded RoundSplit[] in a text column, which is
-- the shape it had under SQLite (see #39). Postgres stores that natively.
--
-- Written by hand rather than taken from `prisma migrate dev`, which wanted
-- to DROP and recreate the column -- that would have discarded the splits of
-- every in-progress session. The USING clause converts the existing text
-- instead, so the data survives the type change.
--
-- The default is dropped first: a text default cannot be reinterpreted
-- against the new type, so it is removed and re-added as a jsonb literal.

ALTER TABLE "WorkoutSession" ALTER COLUMN "roundSplits" DROP DEFAULT;

ALTER TABLE "WorkoutSession"
  ALTER COLUMN "roundSplits" SET DATA TYPE JSONB
  USING "roundSplits"::jsonb;

ALTER TABLE "WorkoutSession" ALTER COLUMN "roundSplits" SET DEFAULT '[]'::jsonb;
