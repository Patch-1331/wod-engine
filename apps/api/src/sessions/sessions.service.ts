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
  async start(assignmentId: string): Promise<WorkoutSession> {
    const assignment = await this.prisma.dailyAssignment.findUnique({
      where: { id: assignmentId },
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

  async get(assignmentId: string): Promise<WorkoutSession | null> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { assignmentId },
    });
    return session ? toSessionDto(session) : null;
  }

  async logRound(
    assignmentId: string,
    round: RoundSplit,
  ): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { assignmentId },
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
    assignmentId: string,
    roundSplitCount: number | null,
  ): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { assignmentId },
    });
    if (!session)
      throw new NotFoundException('No active session for this assignment');

    const updated = await this.prisma.workoutSession.update({
      where: { assignmentId },
      data: { roundSplitCount },
    });

    return toSessionDto(updated);
  }

  async finish(assignmentId: string): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { assignmentId },
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
}
