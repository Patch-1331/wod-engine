import { z } from "zod";
import { assignmentStatus } from "./enums";
import { wodSchema } from "./wod";

export const todayAssignmentSchema = z.object({
  id: z.string(),
  date: z.string(),
  status: assignmentStatus,
  wod: wodSchema,
});
export type TodayAssignment = z.infer<typeof todayAssignmentSchema>;

/**
 * `assignment` is null exactly when `isRestDay` is true and no WOD has
 * been generated for today — the week's day cap (ScheduleRule.maxDaysPerWeek)
 * has already been reached.
 */
export const todayResponseSchema = z.object({
  date: z.string(),
  isRestDay: z.boolean(),
  assignment: todayAssignmentSchema.nullable(),
});
export type TodayResponse = z.infer<typeof todayResponseSchema>;
