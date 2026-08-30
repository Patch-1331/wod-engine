/**
 * Pure scheduling logic — no DB, no Date.now(), no Math.random() calls
 * baked in. Everything the algorithm needs comes in as arguments so it's
 * deterministic and unit-testable given a seed and a history.
 */

export type WodCandidate = {
  id: string;
  name: string;
  type: string;
  dominantPattern: string;
};

export type RecentAssignment = {
  date: string; // ISO date, YYYY-MM-DD
  wod: WodCandidate;
};

/**
 * Picks the next WOD given the library and recent history.
 *
 * Rules, in order:
 * 1. Prefer WODs whose name AND dominant pattern were not used within
 *    `cooldownDays` of `today`.
 * 2. If that empties the pool (a small library exhausts fast), relax to
 *    just excluding an exact repeat of the most recent WOD.
 * 3. If that's still empty (a one-WOD library), any candidate is fair
 *    game.
 * 4. Within whatever pool survives, softly prefer a different WOD type
 *    than yesterday's, to alternate formats — but never let that rule
 *    empty the pool.
 *
 * `history` does not need to be pre-filtered — this function does its
 * own date-window filtering — but must be sorted most-recent-first.
 */
export function pickWod(
  candidates: WodCandidate[],
  history: RecentAssignment[],
  today: string,
  cooldownDays: number,
  rng: () => number,
): WodCandidate {
  if (candidates.length === 0) {
    throw new Error('pickWod: no candidates to choose from');
  }

  const cutoff = addDays(today, -cooldownDays);
  const recent = history.filter((r) => r.date >= cutoff && r.date < today);

  const usedNames = new Set(recent.map((r) => r.wod.name));
  const usedPatterns = new Set(recent.map((r) => r.wod.dominantPattern));

  let pool = candidates.filter(
    (c) => !usedNames.has(c.name) && !usedPatterns.has(c.dominantPattern),
  );

  if (pool.length === 0) {
    const lastName = history[0]?.wod.name;
    pool = candidates.filter((c) => c.name !== lastName);
  }

  if (pool.length === 0) {
    pool = candidates;
  }

  const lastType = history[0]?.wod.type;
  if (lastType) {
    const alternated = pool.filter((c) => c.type !== lastType);
    if (alternated.length > 0) {
      pool = alternated;
    }
  }

  const index = Math.floor(rng() * pool.length);
  return pool[Math.min(index, pool.length - 1)];
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/** Monday–Sunday range (inclusive) containing the given ISO date. */
export function getWeekRange(isoDate: string): { start: string; end: string } {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { start: toIsoDate(monday), end: toIsoDate(sunday) };
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** True once the week already has `maxDaysPerWeek` workout-day assignments. */
export function isRestDay(
  assignedDaysThisWeek: number,
  maxDaysPerWeek: number,
): boolean {
  return assignedDaysThisWeek >= maxDaysPerWeek;
}

export type ExerciseWithLine = {
  line: string | null;
};

/**
 * Swaps each movement's exercise for the one at the user's current rung on
 * that movement's line, so a generated WOD reflects the user's actual level
 * instead of always Rx (Feature #2). Reps are left untouched — only the
 * exercise identity changes, matching "preserve function" (source 01 in the
 * design doc): same rep scheme, movement scaled within its own pattern.
 *
 * Movements whose exercise isn't on a tracked line (`line === null`, e.g.
 * cardio) pass through unchanged, as does any movement where no rung is on
 * record or no exercise exists at that line+rung — a curated WOD should
 * never end up with a hole in its movement list because of a data gap.
 */
export function applyCurrentRung<
  M extends { exercise: E },
  E extends ExerciseWithLine,
>(
  movements: M[],
  currentRung: Map<string, number>,
  exerciseAtRung: Map<string, E>, // key: `${line}:${rung}`
): M[] {
  return movements.map((m) => {
    const line = m.exercise.line;
    if (!line) return m;

    const rung = currentRung.get(line);
    if (rung === undefined) return m;

    const substitute = exerciseAtRung.get(`${line}:${rung}`);
    if (!substitute) return m;

    return { ...m, exercise: substitute };
  });
}
