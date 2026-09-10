-- How each movement is performed, in prose. Nullable: existing rows have no
-- copy until the seed reruns, and a row added outside the seed shouldn't be
-- blocked on text that hasn't been written yet. The web client already
-- renders a movement with no instructions as a plain, non-expandable row.
ALTER TABLE "Exercise" ADD COLUMN     "instructions" TEXT;
