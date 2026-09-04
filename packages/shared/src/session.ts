import { z } from "zod";
import { sessionStatus } from "./enums";

export const roundSplitSchema = z.object({
  round: z.number().int().positive(),
  atSeconds: z.number().int().nonnegative(),
});
export type RoundSplit = z.infer<typeof roundSplitSchema>;

export const workoutSessionSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  startedAt: z.string().datetime(),
  capSeconds: z.number().int().positive(),
  roundSplits: z.array(roundSplitSchema),
  status: sessionStatus,
  /** Elapsed time when "Finish" was tapped — the natural score for a For Time WOD. */
  finishedAtSeconds: z.number().int().nonnegative().nullable(),
  /** Optional user-chosen round count to break high-rep movements into; null = unsplit. */
  roundSplitCount: z.number().int().positive().nullable(),
  // Feature #63 — stamped when each checklist is finished; null if skipped
  // or the setting is off.
  warmupCompletedAt: z.string().datetime().nullable(),
  cooldownCompletedAt: z.string().datetime().nullable(),
  // Feature #30 — where the EMOM/Tabata interval timer has got to. Both are
  // null on a non-interval WOD and until the timer is started; together they
  // let a reloaded screen resume mid-interval instead of restarting the
  // sequence. `intervalIndex === intervalCount` means the last interval has
  // run out, so the sequence is done.
  intervalIndex: z.number().int().nonnegative().nullable(),
  /** Elapsed seconds (from `startedAt`) at which `intervalIndex` began. */
  intervalStartedAtSeconds: z.number().int().nonnegative().nullable(),
});
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

/** Sent on every "round complete" tap so a locked/refreshed screen never loses progress. */
export const logRoundSplitSchema = z.object({
  round: z.number().int().positive(),
  atSeconds: z.number().int().nonnegative(),
});
export type LogRoundSplit = z.infer<typeof logRoundSplitSchema>;

export const setRoundSplitRequestSchema = z.object({
  roundSplitCount: z.number().int().positive().nullable(),
});
export type SetRoundSplitRequest = z.infer<typeof setRoundSplitRequestSchema>;

/**
 * Sent as each interval rolls over, so a locked or refreshed screen picks
 * the sequence back up where it was — the interval-timer counterpart to
 * logRoundSplit's autosave.
 *
 * `intervalIndex` is the 0-based interval now starting; passing
 * `intervalCount` (one past the last) marks the sequence finished.
 */
export const advanceIntervalSchema = z.object({
  intervalIndex: z.number().int().nonnegative(),
  atSeconds: z.number().int().nonnegative(),
});
export type AdvanceInterval = z.infer<typeof advanceIntervalSchema>;
