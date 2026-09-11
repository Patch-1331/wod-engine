import { z } from "zod";

/**
 * The handful of preferences the app exposes — not full ScheduleRule CRUD,
 * which is separate, unbuilt Program-Editor work (#20).
 */
export const settingsSchema = z.object({
  /** Feature #63 — show the warm-up/cool-down checklists at all. */
  warmupCooldownEnabled: z.boolean(),
  /**
   * Whether reaching a WOD's time cap stops the clock and ends the session.
   * On by default; turning it off hands the clock back to the athlete, who
   * then taps FINISH whenever they're done. Read through the session's own
   * `autoStopAtCap`, which is snapshotted at start — this is the preference
   * for the *next* workout, not a switch on one already running.
   */
  autoStopAtCapEnabled: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

/**
 * A PATCH carries only the toggles being changed, so two independent
 * switches never have to restate each other's value — and a stale tab can't
 * flip one back by echoing what it last read.
 */
export const updateSettingsSchema = settingsSchema.partial();
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
