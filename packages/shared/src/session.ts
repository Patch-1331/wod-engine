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
});
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

/** Sent on every "round complete" tap so a locked/refreshed screen never loses progress. */
export const logRoundSplitSchema = z.object({
  round: z.number().int().positive(),
  atSeconds: z.number().int().nonnegative(),
});
export type LogRoundSplit = z.infer<typeof logRoundSplitSchema>;
