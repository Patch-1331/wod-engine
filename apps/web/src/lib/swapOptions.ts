import type { ApiExercise } from "./api";

/**
 * The ladder a swap can move along (WOD-5).
 *
 * Pure, and in lib rather than beside the panel that renders it, so the
 * choice the athlete is offered can be tested without mounting anything —
 * the same split scheduler.logic.ts makes on the API side.
 */

export type SwapOption = {
  exerciseId: string;
  name: string;
  /** Null on the no-equipment alternative, which sits off the ladder. */
  rung: number | null;
  isCurrent: boolean;
  /** The alternative is offered for equipment, not difficulty — labelled, not ranked. */
  isAlternative: boolean;
};

/**
 * The ladder as the athlete should see it: every rung on the movement's line
 * in order, then the current exercise's no-equipment alternative if it has
 * one and it isn't already a rung.
 *
 * Returns an empty list when the movement isn't on a tracked line — cardio
 * has no ladder to climb, so the row gets no swap control at all rather than
 * a control that opens onto nothing.
 */
export function buildSwapOptions(
  exercises: ApiExercise[],
  line: string | null,
  currentExerciseId: string,
): SwapOption[] {
  if (!line) return [];

  const rungs = exercises
    .filter((e) => e.line === line && e.rung !== null)
    .sort((a, b) => (a.rung ?? 0) - (b.rung ?? 0));
  if (rungs.length === 0) return [];

  const options: SwapOption[] = rungs.map((e) => ({
    exerciseId: e.id,
    name: e.name,
    rung: e.rung,
    isCurrent: e.id === currentExerciseId,
    isAlternative: false,
  }));

  const alt = exercises.find((e) => e.id === currentExerciseId)?.altExercise;
  if (alt && !options.some((o) => o.exerciseId === alt.id)) {
    options.push({
      exerciseId: alt.id,
      name: alt.name,
      rung: null,
      isCurrent: alt.id === currentExerciseId,
      isAlternative: true,
    });
  }

  return options;
}
