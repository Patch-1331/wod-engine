import { z } from "zod";
import { movementPattern } from "./enums";

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  pattern: movementPattern,
  needsBar: z.boolean(),
  scalable: z.boolean(),
  altExerciseId: z.string().nullable(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const createExerciseSchema = exerciseSchema.omit({ id: true });
export type CreateExercise = z.infer<typeof createExerciseSchema>;
