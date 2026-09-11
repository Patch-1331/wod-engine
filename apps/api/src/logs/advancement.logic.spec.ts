import {
  computeRungSuggestions,
  MovementForAdvancement,
} from './advancement.logic';

// The per-round arithmetic itself lives in packages/shared (round-split) and
// is unit-tested there; what matters here is that the rule reads through it,
// so a ladder is credited as prescribed.
//
// These are suggestions, not decisions: nothing here writes a rung. The
// athlete's own swap does that, and the absence of a downward rule is the
// point rather than an omission -- see the case at the bottom.

describe('computeRungSuggestions', () => {
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

  it('suggests the next rung when the equivalent of 3x8 was cleanly performed', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    const suggestions = computeRungSuggestions(
      [pushUp],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([{ line: 'push_horizontal', from: 1, to: 2 }]);
  });

  it('says nothing when the session falls short of the threshold', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    // 2 rounds of 8 = 16 total, under the 24 needed to suggest anything.
    const suggestions = computeRungSuggestions(
      [pushUp],
      2,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([]);
  });

  it('never advances a line past its known maximum rung', () => {
    const currentRung = new Map([['push_horizontal', 3]]); // already at the ceiling
    const suggestions = computeRungSuggestions(
      [pushUp],
      5,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([]);
  });

  it('never suggests moving a line down, however bad the session was', () => {
    // One round of 8 reps -- the old rule read this as evidence to demote,
    // which is the inference least worth trusting and the one whose failure
    // mode is worst: a hard Tuesday quietly making Wednesday easier without
    // asking. The app never lowers an athlete; swapping down is their call.
    const currentRung = new Map([['push_horizontal', 2]]);
    const suggestions = computeRungSuggestions(
      [pushUp],
      1,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([]);
  });

  it('ignores movements with no tracked line', () => {
    const currentRung = new Map([['push_horizontal', 1]]);
    const suggestions = computeRungSuggestions(
      [burpee],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([]);
  });

  it('ignores a line with no recorded SkillLevel row', () => {
    const currentRung = new Map<string, number>(); // no rows at all
    const suggestions = computeRungSuggestions(
      [pushUp],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([]);
  });

  it('credits a ladder by its scheme, not an even share of the total', () => {
    // Fran's Cousin: 21-15-9 push-ups, abandoned after the first round.
    // 21 reps is short of the 24 needed, so nothing is suggested -- but it is
    // credited as 21, not as an even 3-way share of the 45 total.
    const ladderPushUp: MovementForAdvancement = {
      reps: 45,
      repScheme: [21, 15, 9],
      exercise: { line: 'push_horizontal' },
    };
    const currentRung = new Map([['push_horizontal', 2]]);
    const suggestions = computeRungSuggestions(
      [ladderPushUp],
      1,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([]);
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
    const suggestions = computeRungSuggestions(
      [ladderPushUp],
      2,
      5,
      currentRung,
      maxRungByLine,
    );
    // 21+15 = 36, past the 24-rep advance threshold.
    expect(suggestions).toEqual([{ line: 'push_horizontal', from: 1, to: 2 }]);
  });

  it('evaluates multiple lines in one WOD independently', () => {
    const currentRung = new Map([
      ['push_horizontal', 1],
      ['squat', 1],
    ]);
    // 3 completed rounds: push-up totals 3x8=24 (advance), air squat totals
    // 3x15=45 (also advance — a movement only ever moves its own line by
    // one rung regardless of how far past the threshold it lands).
    const suggestions = computeRungSuggestions(
      [pushUp, airSquat],
      3,
      null,
      currentRung,
      maxRungByLine,
    );
    expect(suggestions).toEqual([
      { line: 'push_horizontal', from: 1, to: 2 },
      { line: 'squat', from: 1, to: 2 },
    ]);
  });
});
