import type { RoundSplit } from '@wod-engine/shared';

/**
 * Merges a newly-tapped round split into the existing list.
 *
 * A resubmission of the same round number (e.g. a retried request after a
 * flaky connection) replaces rather than duplicates, and the result is
 * always sorted by round number regardless of tap order — a locked screen
 * can deliver taps out of sequence once it reconnects.
 */
export function mergeRoundSplit(
  existing: RoundSplit[],
  next: RoundSplit,
): RoundSplit[] {
  const withoutThisRound = existing.filter((s) => s.round !== next.round);
  return [...withoutThisRound, next].sort((a, b) => a.round - b.round);
}
