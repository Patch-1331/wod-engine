import { z } from "zod";
import { movementPattern, resultType, wodType } from "./enums";

export const workoutLogSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  resultType: resultType,
  resultValue: z.string(),
  rpe: z.number().int().min(1).max(10).nullable(),
  notes: z.string().nullable(),
});
export type WorkoutLog = z.infer<typeof workoutLogSchema>;

/** Request body for POST /assignments/:id/log — assignmentId comes from the URL, not the body. */
export const logResultRequestSchema = z.object({
  resultType: resultType,
  resultValue: z.string().min(1),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type LogResultRequest = z.infer<typeof logResultRequestSchema>;

/** One row of the History list — a log with just enough WOD/date context to render it. */
export const workoutLogListItemSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  date: z.string(),
  wodName: z.string(),
  wodType: wodType,
  dominantPattern: movementPattern,
  resultType: resultType,
  resultValue: z.string(),
  rpe: z.number().int().min(1).max(10).nullable(),
  notes: z.string().nullable(),
});
export type WorkoutLogListItem = z.infer<typeof workoutLogListItemSchema>;
