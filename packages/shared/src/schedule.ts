import { z } from "zod";

export const scheduleRuleSchema = z.object({
  id: z.string(),
  maxDaysPerWeek: z.number().int().min(1).max(7),
  patternCooldownDays: z.number().int().min(0),
});
export type ScheduleRule = z.infer<typeof scheduleRuleSchema>;

export const updateScheduleRuleSchema = scheduleRuleSchema.omit({ id: true });
export type UpdateScheduleRule = z.infer<typeof updateScheduleRuleSchema>;
