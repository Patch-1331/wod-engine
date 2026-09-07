import { advanceInterval, mergeRoundSplit } from './session.logic';

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

describe('advanceInterval', () => {
  it('starting interval 0 records the anchor without closing a split', () => {
    expect(advanceInterval([], { intervalIndex: 0, atSeconds: 3 })).toEqual({
      roundSplits: [],
      intervalIndex: 0,
      intervalStartedAtSeconds: 3,
    });
  });

  it('closes the interval just finished as a round split', () => {
    const first = advanceInterval([], { intervalIndex: 0, atSeconds: 0 });
    const second = advanceInterval(first.roundSplits, {
      intervalIndex: 1,
      atSeconds: 60,
    });

    expect(second).toEqual({
      roundSplits: [{ round: 1, atSeconds: 60 }],
      intervalIndex: 1,
      intervalStartedAtSeconds: 60,
    });
  });

  it('records the last interval when the sequence runs out (index == count)', () => {
    const existing = [{ round: 1, atSeconds: 60 }];
    const result = advanceInterval(existing, {
      intervalIndex: 2,
      atSeconds: 120,
    });

    expect(result.roundSplits).toEqual([
      { round: 1, atSeconds: 60 },
      { round: 2, atSeconds: 120 },
    ]);
    expect(result.intervalIndex).toBe(2);
  });

  it('rewrites rather than duplicates a replayed rollover', () => {
    const existing = [{ round: 1, atSeconds: 60 }];
    const result = advanceInterval(existing, {
      intervalIndex: 1,
      atSeconds: 61,
    });

    expect(result.roundSplits).toEqual([{ round: 1, atSeconds: 61 }]);
  });
});
