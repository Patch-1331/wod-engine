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

export type MovementForAdvancement = {
  reps: number;
  exercise: { line: string | null };
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
  return Array.from({ length: rounds }, (_, i) => base + (i < remainder ? 1 : 0));
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

    let to = from;
    if (totalReps >= ADVANCE_THRESHOLD) {
      const max = maxRungByLine.get(line) ?? from;
      to = Math.min(from + 1, max);
    } else if (totalReps < HOLD_FLOOR) {
      to = Math.max(from - 1, 0);
    }

    if (to !== from) {
      changes.push({ line, from, to });
    }
  }

  return changes;
}
