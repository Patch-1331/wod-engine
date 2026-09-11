import { z } from "zod";

/**
 * A movement the athlete swapped for this day only (WOD-5). The app decides
 * what you do; you decide how hard it is — this is the write path for the
 * second half of that, and the permanent rung change is confirmed afterwards
 * from what was actually trained.
 *
 * Keyed by WodMovement rather than by exercise, so a WOD naming the same
 * line twice moves only the row the athlete tapped.
 */
export const setSubstitutionRequestSchema = z.object({
  wodMovementId: z.string().min(1),
  exerciseId: z.string().min(1),
});
export type SetSubstitutionRequest = z.infer<
  typeof setSubstitutionRequestSchema
>;
