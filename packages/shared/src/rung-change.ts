import { z } from "zod";
import { progressionLine } from "./enums.js";

/**
 * A rung change the completion screen offers to make permanent (WOD-6).
 *
 * The athlete swapped a movement before training; this is the offer to turn
 * that day's choice into their standing level. One per line, and declining is
 * free — the session is already logged either way.
 */
export const proposedRungChangeSchema = z.object({
  line: progressionLine,
  fromRung: z.number().int().nonnegative(),
  toRung: z.number().int().nonnegative(),
  exerciseId: z.string(),
  exerciseName: z.string(),
});
export type ProposedRungChange = z.infer<typeof proposedRungChangeSchema>;
