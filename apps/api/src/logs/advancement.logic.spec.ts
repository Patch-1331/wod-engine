import {
  computeRungChanges,
  MovementForAdvancement,
  totalRepsForMovement,
} from './advancement.logic';

describe('totalRepsForMovement', () => {
  it('multiplies reps per round by completed rounds when there is no split', () => {
    expect(totalRepsForMovement({ reps: 8 }, 3, null)).toBe(24);
  });

  it('is zero when no rounds were completed', () => {
    expect(totalRepsForMovement({ reps: 8 }, 0, null)).toBe(0);
  });

  it('treats a single-round WOD\'s reps as the full prescribed amount', () => {
    // e.g. a for_time WOD with rounds: 1 and reps: 75 — one "round complete"
    // tap means the whole 75 was done.
    expect(totalRepsForMovement({ reps: 75 }, 1, null)).toBe(75);
  });

  it('sums front-loaded split chunks instead of the full per-round reps', () => {
    // 20 reps split into 6 rounds -> 4,4,3,3,3,3 (front-loaded remainder).
    // Completing 2 split-taps should count 4+4=8, not 2*20=40.
    expect(totalRepsForMovement({ reps: 20 }, 2, 6)).toBe(8);
  });

  it('caps split-tap counting at the number of split rounds that exist', () => {
    // Only 6 split rounds exist; a stray 7th tap shouldn't add more reps.
    const all6 = totalRepsForMovement({ reps: 20 }, 6, 6);
    const withExtraTap = totalRepsForMovement({ reps: 20 }, 7, 6);
    expect(withExtraTap).toBe(all6);
    expect(all6).toBe(20);
  });
});

describe('computeRungChanges', () => {
  const pushUp: MovementForAdvancement = { reps: 8, exercise: { line: 'push_horizontal' } };
  const airSquat: MovementForAdvancement = { reps: 15, exercise: { line: 'squat' } };
  const burpee: MovementForAdvancement = { reps: 10, exercise: { line: null } };

  const maxRungByLine = new Map([
    ['push_horizontal', 3],
    ['squat', 3],
  ]);

  it('advances a line when the equivalent of 3x8 was cleanly performed', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    const changes = computeRungChanges([pushUp], 3, null, currentRung, maxRungByLine);
    expect(changes).toEqual([{ line: 'push_horizontal', from: 1, to: 2 }]);
  });

  it('drops a line when reps fall below the 3x5 floor', () => {
    const currentRung = new Map([['push_horizontal', 2]]);
    // 1 round of 8 reps = 8 total, well under the 15-rep floor.
    const changes = computeRungChanges([pushUp], 1, null, currentRung, maxRungByLine);
    expect(changes).toEqual([{ line: 'push_horizontal', from: 2, to: 1 }]);
  });

  it('holds steady in between the two thresholds', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    // 2 rounds of 8 = 16 total — above the 15 floor, below the 24 ceiling.
    const changes = computeRungChanges([pushUp], 2, null, currentRung, maxRungByLine);
    expect(changes).toEqual([]);
  });

  it('never advances a line past its known maximum rung', () => {
    const currentRung = new Map([['push_horizontal', 3]]); // already at the ceiling
    const changes = computeRungChanges([pushUp], 5, null, currentRung, maxRungByLine);
    expect(changes).toEqual([]);
  });

  it('never drops a line below rung 0', () => {
    const currentRung = new Map([['push_horizontal', 0]]);
    const changes = computeRungChanges([pushUp], 1, null, currentRung, maxRungByLine);
    expect(changes).toEqual([]);
  });

  it('ignores movements with no tracked line', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    const changes = computeRungChanges([burpee], 3, null, currentRung, maxRungByLine);
    expect(changes).toEqual([]);
  });

  it('ignores a line with no recorded SkillLevel row', () => {
    const currentRung = new Map<string, number>(); // no rows at all
    const changes = computeRungChanges([pushUp], 3, null, currentRung, maxRungByLine);
    expect(changes).toEqual([]);
  });

  it('evaluates multiple lines in one WOD independently', () => {
    const currentRung = new Map([
      ['push_horizontal', 1],
      ['squat', 1],
    ]);
    // 3 completed rounds: push-up totals 3x8=24 (advance), air squat totals
    // 3x15=45 (also advance — a movement only ever moves its own line by
    // one rung regardless of how far past the threshold it lands).
    const changes = computeRungChanges([pushUp, airSquat], 3, null, currentRung, maxRungByLine);
    expect(changes).toEqual([
      { line: 'push_horizontal', from: 1, to: 2 },
      { line: 'squat', from: 1, to: 2 },
    ]);
  });
});
