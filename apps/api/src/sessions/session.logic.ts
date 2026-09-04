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

export type IntervalProgress = {
  roundSplits: RoundSplit[];
  intervalIndex: number;
  intervalStartedAtSeconds: number;
};

/**
 * Records an EMOM/Tabata interval rollover.
 *
 * `intervalIndex` is the 0-based interval now starting — so it doubles as
 * the count of intervals already behind the athlete, and each rollover
 * closes out the one before it as a round split. That keeps the interval
 * screen feeding the same `roundSplits` the AMRAP screen does, so the
 * result prefill and history read an EMOM without knowing it was one.
 *
 * Starting interval 0 closes nothing, and a replayed rollover (a retried
 * request, or two ticks racing on a reconnect) rewrites the same split
 * rather than adding one — see mergeRoundSplit.
 */
export function advanceInterval(
  existing: RoundSplit[],
  next: { intervalIndex: number; atSeconds: number },
): IntervalProgress {
  const roundSplits =
    next.intervalIndex > 0
      ? mergeRoundSplit(existing, {
          round: next.intervalIndex,
          atSeconds: next.atSeconds,
        })
      : existing;

  return {
    roundSplits,
    intervalIndex: next.intervalIndex,
    intervalStartedAtSeconds: next.atSeconds,
  };
}
