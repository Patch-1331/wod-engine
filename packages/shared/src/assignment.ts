import { z } from "zod";
import { assignmentStatus } from "./enums";

export const dailyAssignmentSchema = z.object({
  id: z.string(),
  date: z.string().date(),
  wodId: z.string(),
  status: assignmentStatus,
});
export type DailyAssignment = z.infer<typeof dailyAssignmentSchema>;

export const createDailyAssignmentSchema = dailyAssignmentSchema.omit({
  id: true,
});
export type CreateDailyAssignment = z.infer<typeof createDailyAssignmentSchema>;
