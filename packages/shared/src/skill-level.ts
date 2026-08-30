import { z } from "zod";
import { progressionLine } from "./enums";

/** Current rung per progression line — one row per line, v1 single-user (see User). */
export const skillLevelSchema = z.object({
  id: z.string(),
  line: progressionLine,
  rung: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});
export type SkillLevel = z.infer<typeof skillLevelSchema>;
