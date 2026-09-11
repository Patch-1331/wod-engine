/**
 * What a finished session offers to make permanent (WOD-6).
 *
 * A swap applies to today only. If the athlete trained a line at a rung other
 * than the one on record, the completion screen offers to move it — "you did
 * chin-ups today, make that your pull movement?" The rung then moves because
 * of what they actually did, which is a far better signal than an inference
 * drawn from metcon rounds, and it is what makes the progression theirs.
 */

export type TrainedRung = {
  line: string;
  rung: number;
  exerciseId: string;
  exerciseName: string;
};

export type ProposedRungChange = {
  line: string;
  fromRung: number;
  toRung: number;
  exerciseId: string;
  exerciseName: string;
};

/**
 * Proposals are per line, never per movement: one prompt for "pull", however
 * many pull movements the WOD happened to contain.
 *
 * Where a line was trained at two different rungs in one session — two pull
 * movements, swapped differently — the **highest** wins. Someone who did both
 * chin-ups and negatives did chin-ups, and recording the easier of the two
 * would propose a demotion off the back of a session that demonstrated the
 * opposite.
 *
 * A proposal can still move a line *down*, and that is deliberate: the
 * athlete swapped down on purpose, and confirming it is their choice. What
 * the app never does is lower anyone on its own.
 */
export function proposeRungChanges(
  trained: TrainedRung[],
  currentRung: Map<string, number>,
): ProposedRungChange[] {
  const bestByLine = new Map<string, TrainedRung>();
  for (const t of trained) {
    // No SkillLevel row means the line isn't tracked for this athlete, so
    // there is nothing to move.
    if (!currentRung.has(t.line)) continue;

    const best = bestByLine.get(t.line);
    if (!best || t.rung > best.rung) bestByLine.set(t.line, t);
  }

  const proposals: ProposedRungChange[] = [];
  for (const [line, t] of bestByLine) {
    const fromRung = currentRung.get(line)!;
    if (fromRung === t.rung) continue; // already on record — nothing to ask

    proposals.push({
      line,
      fromRung,
      toRung: t.rung,
      exerciseId: t.exerciseId,
      exerciseName: t.exerciseName,
    });
  }

  // Stable order so the card doesn't reshuffle between reads.
  return proposals.sort((a, b) => a.line.localeCompare(b.line));
}
