import { z } from "zod";
import { exerciseUnit, movementPattern, progressionLine, wodType } from "./enums";

export const wodMovementSchema = z.object({
  id: z.string(),
  // Count in whatever unit the exercise itself uses — see exercise.unit.
  reps: z.number().int().positive(),
  order: z.number().int().nonnegative(),
  exercise: z.object({
    id: z.string(),
    name: z.string(),
    pattern: movementPattern,
    needsBar: z.boolean(),
    unit: exerciseUnit,
    // Progression tracking (Feature #2) — null for exercises not on a
    // tracked ladder (e.g. cardio). See ProgressionLine for why this is
    // finer-grained than `pattern`.
    line: progressionLine.nullable(),
  }),
});
export type WodMovement = z.infer<typeof wodMovementSchema>;

export const wodSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: wodType,
  timeCapMinutes: z.number().int().positive(),
  rounds: z.number().int().positive().nullable(),
  // Interval structure for the emom/tabata timer (Feature #30) — null on
  // AMRAP/For Time, and on interval WODs seeded before the fields existed.
  // Read these through `resolveIntervalConfig`, which fills the format's
  // classic structure in for the nulls.
  workSeconds: z.number().int().positive().nullable(),
  restSeconds: z.number().int().nonnegative().nullable(),
  intervalCount: z.number().int().positive().nullable(),
  isNamed: z.boolean(),
  dominantPattern: movementPattern,
  movements: z.array(wodMovementSchema),
});
export type Wod = z.infer<typeof wodSchema>;
