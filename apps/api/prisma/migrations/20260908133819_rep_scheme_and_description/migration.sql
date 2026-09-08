-- AlterTable
ALTER TABLE "Wod" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "WodMovement" ADD COLUMN     "repScheme" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- `reps` is the ladder's total, so a scheme that doesn't sum to it would make
-- the app count one workout on screen and credit a different one to the
-- progression lines. Prisma can't express this, and a plain CHECK can't hold a
-- subquery, so the sum goes through an IMMUTABLE function — which is what lets
-- it be used in a constraint at all.
CREATE FUNCTION rep_scheme_sum(scheme INTEGER[]) RETURNS INTEGER
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT COALESCE(SUM(n), 0)::INTEGER FROM unnest(scheme) AS n $$;

ALTER TABLE "WodMovement"
  ADD CONSTRAINT "WodMovement_repScheme_sums_to_reps"
  CHECK (cardinality("repScheme") = 0 OR "reps" = rep_scheme_sum("repScheme"));
