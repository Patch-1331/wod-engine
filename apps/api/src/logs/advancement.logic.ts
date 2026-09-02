/**
 * Pure advancement logic — no DB. Given how many rounds were completed and
 * what a WOD's movements actually are, decides which progression lines
 * (Feature #2) should move up or down a rung.
 *
 * Rule (uniform across every line — see the "Scaling the Ladder" design doc
 * for why not Convict Conditioning's own per-exercise thresholds): a total
 * equivalent to 3x8 clean reps advances the line a rung; below the
 * equivalent of 3x5 drops it back one. In between, the line holds.
 */

const ADVANCE_THRESHOLD = 24; // 3 sets of 8
const HOLD_FLOOR = 15; // 3 sets of 5 — below this, drop back a rung

// A hold (e.g. plank) is timed in seconds, not counted in reps, so the same
// 8:5 ratio is applied to a longer, hold-appropriate base unit (30s) instead
// of the reps-based one (8 reps) — 3x30s advances, below 3x~19s drops.
const ADVANCE_THRESHOLD_SECONDS = 90; // 3 sets of 30s
const HOLD_FLOOR_SECONDS = 56; // 3 sets of ~19s (same 8:5 ratio as reps)

export type MovementForAdvancement = {
  reps: number;
  exercise: { line: string | null; unit?: string };
};

export type LineRungChange = {
  line: string;
  from: number;
  to: number;
};

/**
 * Mirrors apps/web/src/lib/roundSplit.ts's computeRoundReps so a split
 * session (roundSplitCount set) is counted the same way the UI displayed
 * it — front-loading the remainder — rather than the movement's full
 * per-round rep count times however many split-taps happened.
 */
function computeRoundReps(total: number, rounds: number): number[] {
  if (rounds <= 1) return [total];
  const base = Math.floor(total / rounds);
  const remainder = total % rounds;
  return Array.from(
    { length: rounds },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
}

/** Total reps actually performed for one movement, given how many round-taps were logged. */
export function totalRepsForMovement(
  movement: { reps: number },
  completedRounds: number,
  roundSplitCount: number | null,
): number {
  if (!roundSplitCount || roundSplitCount <= 1) {
    return completedRounds * movement.reps;
  }
  const perRound = computeRoundReps(movement.reps, roundSplitCount);
  const taps = Math.min(completedRounds, perRound.length);
  return perRound.slice(0, taps).reduce((sum, r) => sum + r, 0);
}

/**
 * One movement moves its own line at most one rung per log — no
 * double-advancing on a single great session — and never past a line's
 * known bounds: rung 0 is the floor, and `maxRungByLine` caps the ceiling
 * so a line with nothing seeded at rung+1 just holds instead of pointing
 * at an exercise that doesn't exist.
 */
export function computeRungChanges(
  movements: MovementForAdvancement[],
  completedRounds: number,
  roundSplitCount: number | null,
  currentRung: Map<string, number>,
  maxRungByLine: Map<string, number>,
): LineRungChange[] {
  const changes: LineRungChange[] = [];

  for (const m of movements) {
    const line = m.exercise.line;
    if (!line) continue;

    const from = currentRung.get(line);
    if (from === undefined) continue; // no SkillLevel row for this line — nothing to change

    const totalReps = totalRepsForMovement(m, completedRounds, roundSplitCount);
    const isSeconds = m.exercise.unit === 'seconds';
    const advanceThreshold = isSeconds
      ? ADVANCE_THRESHOLD_SECONDS
      : ADVANCE_THRESHOLD;
    const holdFloor = isSeconds ? HOLD_FLOOR_SECONDS : HOLD_FLOOR;

    let to = from;
    if (totalReps >= advanceThreshold) {
      const max = maxRungByLine.get(line) ?? from;
      to = Math.min(from + 1, max);
    } else if (totalReps < holdFloor) {
      to = Math.max(from - 1, 0);
    }

    if (to !== from) {
      changes.push({ line, from, to });
    }
  }

  return changes;
}
