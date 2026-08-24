import type { WorkoutSession as PrismaWorkoutSession } from '@prisma/client';
import type { RoundSplit, WorkoutSession } from '@wod-engine/shared';

export function parseSplits(json: string): RoundSplit[] {
  return JSON.parse(json) as RoundSplit[];
}

export function toSessionDto(session: PrismaWorkoutSession): WorkoutSession {
  return {
    id: session.id,
    assignmentId: session.assignmentId,
    startedAt: session.startedAt.toISOString(),
    capSeconds: session.capSeconds,
    roundSplits: parseSplits(session.roundSplits),
    status: session.status as WorkoutSession['status'],
    finishedAtSeconds: session.finishedAtSeconds,
  };
}
