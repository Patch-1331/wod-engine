import {
  getWeekRange,
  isRestDay,
  pickWod,
  RecentAssignment,
  WodCandidate,
} from './scheduler.logic';

const cindy: WodCandidate = {
  id: '1',
  name: 'Cindy',
  type: 'amrap',
  dominantPattern: 'pull',
};
const chalkLine: WodCandidate = {
  id: '2',
  name: 'Chalk Line',
  type: 'for_time',
  dominantPattern: 'cardio',
};
const coreCindy: WodCandidate = {
  id: '3',
  name: 'Core Cindy',
  type: 'amrap',
  dominantPattern: 'core',
};
const rungByRung: WodCandidate = {
  id: '4',
  name: 'Rung by Rung',
  type: 'amrap',
  dominantPattern: 'pull',
};

const library = [cindy, chalkLine, coreCindy, rungByRung];
const always0 = () => 0; // deterministic rng: always picks pool[0]

describe('pickWod', () => {
  it('picks from the full library when there is no history', () => {
    const result = pickWod(library, [], '2026-08-23', 5, always0);
    expect(library).toContainEqual(result);
  });

  it('excludes WODs sharing a name or dominant pattern used within the cooldown window', () => {
    const history: RecentAssignment[] = [{ date: '2026-08-22', wod: cindy }];
    // cindy and rungByRung are both "pull" — both should be excluded within a 5-day cooldown
    const result = pickWod(library, history, '2026-08-23', 5, always0);
    expect(result.dominantPattern).not.toBe('pull');
  });

  it('ignores history outside the cooldown window', () => {
    const history: RecentAssignment[] = [{ date: '2026-08-01', wod: cindy }];
    // 22 days before "today" — well outside a 5-day cooldown, so pull is fair game again
    const result = pickWod(library, history, '2026-08-23', 5, always0);
    expect(library.map((w) => w.id)).toContain(result.id);
  });

  it('falls back to excluding only the exact last WOD when cooldown empties the pool', () => {
    // A library where every WOD shares one of two patterns; cooldown after a "pull" WOD
    // would normally exclude every "pull" WOD — here that's everything except chalkLine.
    const smallLibrary = [cindy, rungByRung];
    const history: RecentAssignment[] = [{ date: '2026-08-22', wod: cindy }];
    const result = pickWod(smallLibrary, history, '2026-08-23', 5, always0);
    expect(result.name).not.toBe('Cindy');
    expect(result.name).toBe('Rung by Rung');
  });

  it('returns the only candidate when the library has just one WOD', () => {
    const result = pickWod(
      [cindy],
      [{ date: '2026-08-22', wod: cindy }],
      '2026-08-23',
      5,
      always0,
    );
    expect(result).toEqual(cindy);
  });

  it("prefers a different WOD type than yesterday's when the pool allows it", () => {
    // History has no pattern/name overlap with chalkLine or coreCindy, but yesterday was
    // "for_time" (chalkLine) — the alternation rule should steer toward "amrap".
    const history: RecentAssignment[] = [
      { date: '2026-08-22', wod: chalkLine },
    ];
    const twoWodPool = [chalkLine, coreCindy];
    const result = pickWod(twoWodPool, history, '2026-08-23', 5, always0);
    expect(result.type).toBe('amrap');
  });
});

describe('getWeekRange', () => {
  it('returns Monday–Sunday for a mid-week date', () => {
    // 2026-08-19 is a Wednesday
    expect(getWeekRange('2026-08-19')).toEqual({
      start: '2026-08-17',
      end: '2026-08-23',
    });
  });

  it('handles a Sunday correctly (end of its own week, not start of the next)', () => {
    expect(getWeekRange('2026-08-23')).toEqual({
      start: '2026-08-17',
      end: '2026-08-23',
    });
  });

  it('handles a Monday correctly', () => {
    expect(getWeekRange('2026-08-17')).toEqual({
      start: '2026-08-17',
      end: '2026-08-23',
    });
  });
});

describe('isRestDay', () => {
  it('is false while under the weekly cap', () => {
    expect(isRestDay(4, 5)).toBe(false);
  });

  it('is true once the weekly cap is reached', () => {
    expect(isRestDay(5, 5)).toBe(true);
  });

  it('is true if somehow over the cap', () => {
    expect(isRestDay(6, 5)).toBe(true);
  });
});
