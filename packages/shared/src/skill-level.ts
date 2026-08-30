import { z } from "zod";
import { progressionLine } from "./enums";

/** Current rung per progression line — one row per line, v1 single-user (see User). */
export const skillLevelSchema = z.object({
  id: z.string(),
  line: progressionLine,
  rung: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
  /** Set by the automatic advancement rule; null until then or after a manual override. */
  lastChange: z.enum(["advanced", "dropped"]).nullable(),
});
export type SkillLevel = z.infer<typeof skillLevelSchema>;

/** Manual override — set a line's rung directly (e.g. the automatic rule got it wrong). */
export const setSkillLevelRequestSchema = z.object({
  rung: z.number().int().nonnegative(),
});
export type SetSkillLevelRequest = z.infer<typeof setSkillLevelRequestSchema>;
