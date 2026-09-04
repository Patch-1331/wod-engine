import { z } from "zod";
import type { WodType } from "./enums";

/**
 * The interval structure an EMOM/Tabata screen counts down (Feature #30).
 *
 * One interval is `workSeconds` of work followed by `restSeconds` of rest
 * (0 for EMOM, which runs straight into the next minute), repeated
 * `intervalCount` times.
 */
export const intervalConfigSchema = z.object({
  workSeconds: z.number().int().positive(),
  restSeconds: z.number().int().nonnegative(),
  intervalCount: z.number().int().positive(),
});
export type IntervalConfig = z.infer<typeof intervalConfigSchema>;

/** EMOM is "every minute on the minute" by definition — one 60s interval, no rest. */
const EMOM_DEFAULTS = { workSeconds: 60, restSeconds: 0 };
/** Tabata's classic 20/10 × 8. */
const TABATA_DEFAULTS = { workSeconds: 20, restSeconds: 10, intervalCount: 8 };

type IntervalFields = {
  type: WodType;
  timeCapMinutes: number;
  rounds: number | null;
  workSeconds: number | null;
  restSeconds: number | null;
  intervalCount: number | null;
};

/**
 * The interval structure to run a WOD by, or null for the formats that
 * aren't interval-driven (AMRAP / For Time keep the round-tap stopwatch).
 *
 * The columns are nullable because they were added after the WOD library
 * was seeded, so an EMOM/Tabata row that predates Feature #30 — or a
 * hand-written one that only says "emom, 12 minutes" — still has to run.
 * Those fall back to the format's classic structure rather than refusing
 * to start.
 */
export function resolveIntervalConfig(wod: IntervalFields): IntervalConfig | null {
  if (wod.type === "emom") {
    return {
      workSeconds: wod.workSeconds ?? EMOM_DEFAULTS.workSeconds,
      restSeconds: wod.restSeconds ?? EMOM_DEFAULTS.restSeconds,
      intervalCount: wod.intervalCount ?? wod.rounds ?? wod.timeCapMinutes,
    };
  }

  if (wod.type === "tabata") {
    return {
      workSeconds: wod.workSeconds ?? TABATA_DEFAULTS.workSeconds,
      restSeconds: wod.restSeconds ?? TABATA_DEFAULTS.restSeconds,
      intervalCount: wod.intervalCount ?? wod.rounds ?? TABATA_DEFAULTS.intervalCount,
    };
  }

  return null;
}

/** Total wall-clock length of the interval sequence, rest included. */
export function totalIntervalSeconds(config: IntervalConfig): number {
  return (config.workSeconds + config.restSeconds) * config.intervalCount;
}
