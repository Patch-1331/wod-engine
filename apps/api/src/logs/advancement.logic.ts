/**
 * Pure advancement logic — no DB. Given how many rounds were completed and
 * what a WOD's movements actually are, decides which progression lines
 * (Feature #2) have earned a *suggestion* to move up a rung.
 *
 * It proposes; it does not decide. Under athlete-owned progression the
 * athlete writes their own rung — by swapping a movement before training, or
 * by confirming afterwards what they actually did. This function's output is
 * encouragement offered before a workout and accepted by swapping, never a
 * write. The encouragement survives; the authority doesn't.
 *
 * Rule (uniform across every line — see the "Scaling the Ladder" design doc
 * for why not Convict Conditioning's own per-exercise thresholds): a total
 * equivalent to 3x8 clean reps is evidence the line is ready for the next
 * rung.
 *
 * **There is deliberately no downward rule.** Inferring that a bad session
 * means an athlete got weaker is the inference least worth trusting and the
 * one with the worst failure mode — a hard Tuesday quietly making Wednesday
 * easier without asking. Struggling is answered by the athlete swapping down,
 * which is a choice rather than a verdict. `HOLD_FLOOR`/`HOLD_FLOOR_SECONDS`
 * and their branch were removed with the rest of that authority.
 */

import { totalRepsForMovement } from '@regimen-works/shared';

const ADVANCE_THRESHOLD = 24; // 3 sets of 8

// A hold (e.g. plank) is timed in seconds, not counted in reps, so the same
// bar is expressed in a hold-appropriate base unit (30s) instead of the
// reps-based one (8 reps) — 3x30s is the equivalent evidence.
const ADVANCE_THRESHOLD_SECONDS = 90; // 3 sets of 30s

export type MovementForAdvancement = {
  reps: number;
  repScheme: number[];
  exercise: { line: string | null; unit?: string };
};

export type RungSuggestion = {
  line: string;
  from: number;
  to: number;
};

/**
 * One movement suggests its own line at most one rung up — no double
 * advancing on a single great session — and never past a line's known
 * bounds: `maxRungByLine` caps the ceiling so a line with nothing seeded at
 * rung+1 suggests nothing rather than pointing at an exercise that doesn't
 * exist.
 */
export function computeRungSuggestions(
  movements: MovementForAdvancement[],
  completedRounds: number,
  roundSplitCount: number | null,
  currentRung: Map<string, number>,
  maxRungByLine: Map<string, number>,
): RungSuggestion[] {
  const suggestions: RungSuggestion[] = [];

  for (const m of movements) {
    const line = m.exercise.line;
    if (!line) continue;

    const from = currentRung.get(line);
    if (from === undefined) continue; // no SkillLevel row for this line — nothing to suggest

    const totalReps = totalRepsForMovement(m, completedRounds, roundSplitCount);
    const threshold =
      m.exercise.unit === 'seconds'
        ? ADVANCE_THRESHOLD_SECONDS
        : ADVANCE_THRESHOLD;

    if (totalReps < threshold) continue;

    const max = maxRungByLine.get(line) ?? from;
    const to = Math.min(from + 1, max);
    if (to !== from) {
      suggestions.push({ line, from, to });
    }
  }

  return suggestions;
}
