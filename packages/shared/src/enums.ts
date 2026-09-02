import { z } from "zod";

export const movementPattern = z.enum([
  "push",
  "pull",
  "squat",
  "hinge",
  "core",
  "cardio",
]);
export type MovementPattern = z.infer<typeof movementPattern>;

/**
 * Finer-grained than MovementPattern — a pattern like push or core actually
 * contains multiple independent progression ladders (see docs/plan.md and
 * the "Scaling the Ladder" design doc for Feature #2).
 */
export const progressionLine = z.enum([
  "push_horizontal",
  "push_vertical",
  "pull",
  "squat",
  "hinge",
  "core_dynamic",
  "core_hold",
  "core_side",
]);
export type ProgressionLine = z.infer<typeof progressionLine>;

/** What an Exercise's `reps` count actually measures — most movements count reps, but a hold (e.g. plank) is timed. */
export const exerciseUnit = z.enum(["reps", "seconds"]);
export type ExerciseUnit = z.infer<typeof exerciseUnit>;

/** Tags an Exercise as warm-up/cool-down checklist content (Feature #63). Null for regular pool exercises. */
export const exercisePhase = z.enum(["warmup", "cooldown"]);
export type ExercisePhase = z.infer<typeof exercisePhase>;

export const wodType = z.enum(["amrap", "for_time", "emom", "tabata"]);
export type WodType = z.infer<typeof wodType>;

export const assignmentStatus = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "skipped",
]);
export type AssignmentStatus = z.infer<typeof assignmentStatus>;

export const sessionStatus = z.enum(["in_progress", "completed", "abandoned"]);
export type SessionStatus = z.infer<typeof sessionStatus>;

export const resultType = z.enum(["time_seconds", "rounds_reps", "total_reps"]);
export type ResultType = z.infer<typeof resultType>;
