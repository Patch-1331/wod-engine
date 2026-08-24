import type { WorkoutLogListItem } from "@wod-engine/shared";

export function formatResult(resultType: WorkoutLogListItem["resultType"], resultValue: string): string {
  if (resultType === "time_seconds") {
    const total = Number(resultValue) || 0;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return resultValue.replace("+", " + ");
}

/** Higher is better for both result types, so results can be compared directly once reduced to a number. */
function resultScore(resultType: WorkoutLogListItem["resultType"], resultValue: string): number {
  if (resultType === "time_seconds") {
    // Lower time is better — invert so "higher score wins" holds for both types.
    return -(Number(resultValue) || 0);
  }
  const [rounds, reps] = resultValue.split("+").map((v) => Number(v) || 0);
  return rounds * 100000 + reps;
}

export type PersonalRecord = {
  wodName: string;
  resultType: WorkoutLogListItem["resultType"];
  resultValue: string;
  date: string;
};

/** Best logged result per named WOD, keyed by wodName. */
export function computePRs(logs: WorkoutLogListItem[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const log of logs) {
    const current = best.get(log.wodName);
    if (!current || resultScore(log.resultType, log.resultValue) > resultScore(current.resultType, current.resultValue)) {
      best.set(log.wodName, {
        wodName: log.wodName,
        resultType: log.resultType,
        resultValue: log.resultValue,
        date: log.date,
      });
    }
  }
  return Array.from(best.values()).sort((a, b) => a.wodName.localeCompare(b.wodName));
}

export type Streaks = { current: number; longest: number };

/**
 * Consecutive-calendar-day streaks over logged workout dates. Rest days aren't
 * logged, so a gap of more than one day breaks the streak by design — this
 * measures "days in a row you actually trained," not weekly-plan adherence.
 */
export function computeStreaks(dates: string[], today: string): Streaks {
  const uniqueSorted = Array.from(new Set(dates)).sort();
  if (uniqueSorted.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    run = daysBetween(uniqueSorted[i - 1], uniqueSorted[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  let current = 0;
  const last = uniqueSorted[uniqueSorted.length - 1];
  const gapToToday = daysBetween(last, today);
  if (gapToToday <= 1) {
    current = 1;
    for (let i = uniqueSorted.length - 1; i > 0; i--) {
      if (daysBetween(uniqueSorted[i - 1], uniqueSorted[i]) === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(`${isoA}T00:00:00Z`).getTime();
  const b = new Date(`${isoB}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function computePatternBalance(logs: WorkoutLogListItem[]): Array<{ pattern: string; count: number }> {
  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.dominantPattern, (counts.get(log.dominantPattern) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);
}
