/**
 * Distributes `total` reps across `rounds` as evenly as possible, front-loading
 * the remainder (e.g. 100 over 6 → 17,17,17,17,16,16) rather than dumping it
 * all on the last round.
 */
export function computeRoundReps(total: number, rounds: number): number[] {
  if (rounds <= 1) return [total];
  const base = Math.floor(total / rounds);
  const remainder = total % rounds;
  return Array.from({ length: rounds }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** The movement with the highest total reps — the natural anchor for a reps-per-round split. */
export function anchorMovement<T extends { reps: number }>(movements: T[]): T {
  return movements.reduce((max, m) => (m.reps > max.reps ? m : max), movements[0]);
}

/** Round count that fits `repsPerRound` chunks of the anchor movement's total. */
export function roundsFromReps(anchorTotal: number, repsPerRound: number): number {
  return Math.max(1, Math.ceil(anchorTotal / Math.max(1, repsPerRound)));
}
