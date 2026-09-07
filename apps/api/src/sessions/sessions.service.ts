import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RoundSplit, WorkoutSession } from '@wod-engine/shared';
import { PrismaService } from '../prisma/prisma.service';
import { parseSplits, toSessionDto } from './session.mapper';
import { mergeRoundSplit } from './session.logic';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent: an upsert with a no-op update, not a check-then-create — two
   * concurrent calls (e.g. React's dev-mode double effect invocation) would
   * otherwise race and the second lose to a unique-constraint error.
   */
  async start(userId: string, assignmentId: string): Promise<WorkoutSession> {
    // Scoped by userId so another user's assignment id reads as not found.
    const assignment = await this.prisma.dailyAssignment.findFirst({
      where: { id: assignmentId, userId },
      include: { wod: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (!assignment.wod)
      throw new BadRequestException('Rest days have no workout to start');

    const session = await this.prisma.workoutSession.upsert({
      where: { assignmentId },
      update: {},
      create: {
        assignmentId,
        userId,
        capSeconds: assignment.wod.timeCapMinutes * 60,
        roundSplits: '[]',
        status: 'in_progress',
      },
    });

    if (assignment.status === 'scheduled') {
      await this.prisma.dailyAssignment.update({
        where: { id: assignmentId },
        data: { status: 'in_progress' },
      });
    }

    return toSessionDto(session);
  }

  async get(
    userId: string,
    assignmentId: string,
  ): Promise<WorkoutSession | null> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { assignmentId, userId },
    });
    return session ? toSessionDto(session) : null;
  }

  async logRound(
    userId: string,
    assignmentId: string,
    round: RoundSplit,
  ): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { assignmentId, userId },
    });
    if (!session)
      throw new NotFoundException('No active session for this assignment');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Session is no longer in progress');
    }

    const splits = parseSplits(session.roundSplits);
    const updatedSplits = mergeRoundSplit(splits, round);

    const updated = await this.prisma.workoutSession.update({
      where: { assignmentId },
      data: { roundSplits: JSON.stringify(updatedSplits) },
    });

    return toSessionDto(updated);
  }

  async setRoundSplit(
    userId: string,
    assignmentId: string,
    roundSplitCount: number | null,
  ): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { assignmentId, userId },
    });
    if (!session)
      throw new NotFoundException('No active session for this assignment');

    const updated = await this.prisma.workoutSession.update({
      where: { assignmentId },
      data: { roundSplitCount },
    });

    return toSessionDto(updated);
  }

  async finish(userId: string, assignmentId: string): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { assignmentId, userId },
    });
    if (!session)
      throw new NotFoundException('No active session for this assignment');

    const finishedAtSeconds = Math.round(
      (Date.now() - session.startedAt.getTime()) / 1000,
    );

    const updated = await this.prisma.workoutSession.update({
      where: { assignmentId },
      data: { status: 'completed', finishedAtSeconds },
    });

    return toSessionDto(updated);
  }

  /**
   * Stamps warmupCompletedAt (Feature #63) — the web app only calls this
   * when every checklist item was checked off before proceeding. An
   * explicit skip leaves it null; the timestamp specifically means "the
   * warm-up was actually done," not just "the screen was passed through."
   */
  async completeWarmup(
    userId: string,
    assignmentId: string,
  ): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { assignmentId, userId },
    });
    if (!session)
      throw new NotFoundException('No active session for this assignment');

    const updated = await this.prisma.workoutSession.update({
      where: { assignmentId },
      data: { warmupCompletedAt: new Date() },
    });

    return toSessionDto(updated);
  }

  /** Same contract as completeWarmup, for the cool-down checklist (Feature #63). */
  async completeCooldown(
    userId: string,
    assignmentId: string,
  ): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { assignmentId, userId },
    });
    if (!session)
      throw new NotFoundException('No active session for this assignment');

    const updated = await this.prisma.workoutSession.update({
      where: { assignmentId },
      data: { cooldownCompletedAt: new Date() },
    });

    return toSessionDto(updated);
  }

  async cancel(userId: string, assignmentId: string): Promise<void> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { assignmentId, userId },
    });
    if (!session)
      throw new NotFoundException('No active session for this assignment');
    if (session.status === 'completed') {
      throw new BadRequestException('Session is already completed');
    }

    // Deleted rather than kept as "abandoned" so a later Start Workout tap
    // creates a clean session instead of resuming a dead one.
    await this.prisma.workoutSession.delete({ where: { assignmentId } });
    await this.prisma.dailyAssignment.update({
      where: { id: assignmentId },
      data: { status: 'scheduled' },
    });
  }
}
