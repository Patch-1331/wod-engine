import { z } from "zod";

/** One warm-up/cool-down checklist item (Feature #63) — deliberately minimal, just enough to render a list. */
export const checklistExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type ChecklistExercise = z.infer<typeof checklistExerciseSchema>;
