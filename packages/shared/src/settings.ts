import { z } from "zod";

/**
 * Scoped to just the warm-up/cool-down opt-in (Feature #63) — not full
 * ScheduleRule CRUD, which is separate, unbuilt Program-Editor work (#20).
 */
export const settingsSchema = z.object({
  warmupCooldownEnabled: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const updateSettingsSchema = settingsSchema;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
