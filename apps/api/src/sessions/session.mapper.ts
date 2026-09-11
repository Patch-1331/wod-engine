import type {
  Prisma,
  WorkoutSession as PrismaWorkoutSession,
} from '@prisma/client';
import type { RoundSplit, WorkoutSession } from '@wod-engine/shared';

/**
 * `roundSplits` is a jsonb column, so Prisma hands it back as a JsonValue --
 * already-structured data rather than the text this used to JSON.parse (#39).
 * The cast is the one place that names the shape, so the assertion stays here
 * rather than being repeated at each read site.
 */
export function toRoundSplits(value: Prisma.JsonValue): RoundSplit[] {
  return (value ?? []) as RoundSplit[];
}

export function toSessionDto(session: PrismaWorkoutSession): WorkoutSession {
  return {
    id: session.id,
    assignmentId: session.assignmentId,
    startedAt: session.startedAt.toISOString(),
    capSeconds: session.capSeconds,
    roundSplits: toRoundSplits(session.roundSplits),
    status: session.status as WorkoutSession['status'],
    finishedAtSeconds: session.finishedAtSeconds,
    roundSplitCount: session.roundSplitCount,
    autoStopAtCap: session.autoStopAtCap,
    warmupCompletedAt: session.warmupCompletedAt?.toISOString() ?? null,
    cooldownCompletedAt: session.cooldownCompletedAt?.toISOString() ?? null,
    intervalIndex: session.intervalIndex,
    intervalStartedAtSeconds: session.intervalStartedAtSeconds,
  };
}
