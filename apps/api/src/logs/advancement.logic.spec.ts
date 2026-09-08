import {
  computeRungChanges,
  MovementForAdvancement,
} from './advancement.logic';

// The per-round arithmetic itself lives in packages/shared (round-split) and
// is unit-tested there; what matters here is that the advancement rule reads
// through it, so a ladder is credited as prescribed.

describe('computeRungChanges', () => {
  const pushUp: MovementForAdvancement = {
    reps: 8,
    repScheme: [],
    exercise: { line: 'push_horizontal' },
  };
  const airSquat: MovementForAdvancement = {
    reps: 15,
    repScheme: [],
    exercise: { line: 'squat' },
  };
  const burpee: MovementForAdvancement = {
    reps: 10,
    repScheme: [],
    exercise: { line: null },
  };

  const maxRungByLine = new Map([
    ['push_horizontal', 3],
    ['squat', 3],
  ]);

  it('advances a line when the equivalent of 3x8 was cleanly performed', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    const changes = computeRungChanges(
      [pushUp],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([{ line: 'push_horizontal', from: 1, to: 2 }]);
  });

  it('drops a line when reps fall below the 3x5 floor', () => {
    const currentRung = new Map([['push_horizontal', 2]]);
    // 1 round of 8 reps = 8 total, well under the 15-rep floor.
    const changes = computeRungChanges(
      [pushUp],
      1,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([{ line: 'push_horizontal', from: 2, to: 1 }]);
  });

  it('holds steady in between the two thresholds', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    // 2 rounds of 8 = 16 total — above the 15 floor, below the 24 ceiling.
    const changes = computeRungChanges(
      [pushUp],
      2,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([]);
  });

  it('never advances a line past its known maximum rung', () => {
    const currentRung = new Map([['push_horizontal', 3]]); // already at the ceiling
    const changes = computeRungChanges(
      [pushUp],
      5,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([]);
  });

  it('never drops a line below rung 0', () => {
    const currentRung = new Map([['push_horizontal', 0]]);
    const changes = computeRungChanges(
      [pushUp],
      1,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([]);
  });

  it('ignores movements with no tracked line', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    const changes = computeRungChanges(
      [burpee],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([]);
  });

  it('ignores a line with no recorded SkillLevel row', () => {
    const currentRung = new Map<string, number>(); // no rows at all
    const changes = computeRungChanges(
      [pushUp],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([]);
  });

  it('credits a ladder by its scheme, not an even share of the total', () => {
    // Fran's Cousin: 21-15-9 push-ups, abandoned after the first round.
    // 21 reps clears the 15-rep floor, so the line holds. An even 3-way
    // split of the 45 total would have credited 15 and dropped the line.
    const ladderPushUp: MovementForAdvancement = {
      reps: 45,
      repScheme: [21, 15, 9],
      exercise: { line: 'push_horizontal' },
    };
    const currentRung = new Map([['push_horizontal', 2]]);
    const changes = computeRungChanges(
      [ladderPushUp],
      1,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([]);
  });

  it('lets the scheme win over a stale roundSplitCount', () => {
    // A session that set a split before its WOD gained a scheme: the ladder
    // is how the workout was actually performed, so it decides the credit.
    const ladderPushUp: MovementForAdvancement = {
      reps: 45,
      repScheme: [21, 15, 9],
      exercise: { line: 'push_horizontal' },
    };
    const currentRung = new Map([['push_horizontal', 1]]);
    const changes = computeRungChanges(
      [ladderPushUp],
      2,
      5,
      currentRung,
      maxRungByLine,
    );
    // 21+15 = 36, past the 24-rep advance threshold.
    expect(changes).toEqual([{ line: 'push_horizontal', from: 1, to: 2 }]);
  });

  it('evaluates multiple lines in one WOD independently', () => {
    const currentRung = new Map([
      ['push_horizontal', 1],
      ['squat', 1],
    ]);
    // 3 completed rounds: push-up totals 3x8=24 (advance), air squat totals
    // 3x15=45 (also advance — a movement only ever moves its own line by
    // one rung regardless of how far past the threshold it lands).
    const changes = computeRungChanges(
      [pushUp, airSquat],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(changes).toEqual([
      { line: 'push_horizontal', from: 1, to: 2 },
      { line: 'squat', from: 1, to: 2 },
    ]);
  });
});
