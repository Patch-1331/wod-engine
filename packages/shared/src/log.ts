import { z } from "zod";
import { resultType } from "./enums";

export const workoutLogSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  resultType: resultType,
  resultValue: z.string(),
  rpe: z.number().int().min(1).max(10).nullable(),
  notes: z.string().nullable(),
});
export type WorkoutLog = z.infer<typeof workoutLogSchema>;

export const createWorkoutLogSchema = workoutLogSchema.omit({ id: true });
export type CreateWorkoutLog = z.infer<typeof createWorkoutLogSchema>;
