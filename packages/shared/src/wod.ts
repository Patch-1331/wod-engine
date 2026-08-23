import { z } from "zod";
import { movementPattern, wodType } from "./enums";

export const wodMovementSchema = z.object({
  id: z.string(),
  reps: z.number().int().positive(),
  order: z.number().int().nonnegative(),
  exercise: z.object({
    id: z.string(),
    name: z.string(),
    pattern: movementPattern,
    needsBar: z.boolean(),
  }),
});
export type WodMovement = z.infer<typeof wodMovementSchema>;

/**
 * EMOM's per-minute interval structure is deferred to the Phase 2
 * interval-timer work — `rounds` and `movements` are enough to describe
 * AMRAP / For Time / Tabata today.
 */
export const wodSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: wodType,
  timeCapMinutes: z.number().int().positive(),
  rounds: z.number().int().positive().nullable(),
  isNamed: z.boolean(),
  dominantPattern: movementPattern,
  movements: z.array(wodMovementSchema),
});
export type Wod = z.infer<typeof wodSchema>;
