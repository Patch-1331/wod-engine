import { mergeRoundSplit } from './session.logic';

describe('mergeRoundSplit', () => {
  it('appends a new round to an empty list', () => {
    expect(mergeRoundSplit([], { round: 1, atSeconds: 42 })).toEqual([
      { round: 1, atSeconds: 42 },
    ]);
  });

  it('appends a new round after existing ones', () => {
    const existing = [
      { round: 1, atSeconds: 42 },
      { round: 2, atSeconds: 90 },
    ];
    expect(mergeRoundSplit(existing, { round: 3, atSeconds: 130 })).toEqual([
      { round: 1, atSeconds: 42 },
      { round: 2, atSeconds: 90 },
      { round: 3, atSeconds: 130 },
    ]);
  });

  it('replaces rather than duplicates on a resubmitted round (e.g. a retried request)', () => {
    const existing = [
      { round: 1, atSeconds: 42 },
      { round: 2, atSeconds: 90 },
    ];
    // round 2 tapped again with a slightly different timestamp — the retry, not a new round
    const result = mergeRoundSplit(existing, { round: 2, atSeconds: 91 });
    expect(result).toEqual([
      { round: 1, atSeconds: 42 },
      { round: 2, atSeconds: 91 },
    ]);
  });

  it('keeps the list sorted by round even if a tap arrives out of order', () => {
    const existing = [
      { round: 1, atSeconds: 42 },
      { round: 3, atSeconds: 130 },
    ];
    const result = mergeRoundSplit(existing, { round: 2, atSeconds: 90 });
    expect(result.map((s) => s.round)).toEqual([1, 2, 3]);
  });
});
