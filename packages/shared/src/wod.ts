import { z } from "zod";
import { movementPattern, wodType } from "./enums";

export const wodMovementSchema = z.object({
  exerciseId: z.string(),
  reps: z.number().int().positive(),
});
export type WodMovement = z.infer<typeof wodMovementSchema>;

/**
 * Generic enough for AMRAP / For Time / Tabata now. EMOM's per-minute
 * interval structure is deferred to the Phase 2 interval-timer work.
 */
export const wodStructureSchema = z.object({
  rounds: z.number().int().positive().nullable(),
  movements: z.array(wodMovementSchema).min(1),
});
export type WodStructure = z.infer<typeof wodStructureSchema>;

export const wodSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: wodType,
  timeCapMinutes: z.number().int().positive(),
  structure: wodStructureSchema,
  isNamed: z.boolean(),
  dominantPattern: movementPattern,
});
export type Wod = z.infer<typeof wodSchema>;

export const createWodSchema = wodSchema.omit({ id: true });
export type CreateWod = z.infer<typeof createWodSchema>;
