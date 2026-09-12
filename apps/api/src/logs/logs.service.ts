import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  LogResultRequest,
  WorkoutLog,
  WorkoutLogListItem,
} from '@regimen-works/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates or replaces the log for an assignment, and marks it completed.
   *
   * Saving a result no longer moves any progression rung. The athlete owns
   * their level: they set it by swapping a movement before training, or by
   * confirming afterwards what they actually did. An inference drawn from
   * metcon rounds has no business overruling either, and the drop half of
   * that inference was actively harmful — a hard session quietly making the
   * next one easier without asking.
   */
  async upsert(
    userId: string,
    assignmentId: string,
    body: LogResultRequest,
  ): Promise<WorkoutLog> {
    // findFirst with userId, not findUnique on id alone: another user's
    // assignment id must read as "not found" rather than as someone else's row.
    const assignment = await this.prisma.dailyAssignment.findFirst({
      where: { id: assignmentId, userId },
      include: {
        wod: { include: { movements: { include: { exercise: true } } } },
        session: true,
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (!assignment.wodId || !assignment.wod)
      throw new BadRequestException('Rest days have nothing to log');

    const data = {
      resultType: body.resultType,
      resultValue: body.resultValue,
      rpe: body.rpe ?? null,
      notes: body.notes ?? null,
    };

    const log = await this.prisma.workoutLog.upsert({
      where: { assignmentId },
      update: data,
      create: { assignmentId, userId, ...data },
    });

    await this.prisma.dailyAssignment.update({
      where: { id: assignmentId },
      data: { status: 'completed' },
    });

    return toLogDto(log);
  }

  async getForAssignment(
    userId: string,
    assignmentId: string,
  ): Promise<WorkoutLog | null> {
    const log = await this.prisma.workoutLog.findFirst({
      where: { assignmentId, userId },
    });
    return log ? toLogDto(log) : null;
  }

  async list(userId: string): Promise<WorkoutLogListItem[]> {
    const logs = await this.prisma.workoutLog.findMany({
      where: { userId },
      include: { assignment: { include: { wod: true } } },
      orderBy: { assignment: { date: 'desc' } },
    });

    return logs
      .filter(
        (
          log,
        ): log is typeof log & {
          assignment: typeof log.assignment & {
            wod: NonNullable<typeof log.assignment.wod>;
          };
        } => log.assignment.wod !== null,
      )
      .map((log) => ({
        id: log.id,
        assignmentId: log.assignmentId,
        date: log.assignment.date,
        wodName: log.assignment.wod.name,
        wodType: log.assignment.wod.type as WorkoutLogListItem['wodType'],
        dominantPattern: log.assignment.wod
          .dominantPattern as WorkoutLogListItem['dominantPattern'],
        resultType: log.resultType as WorkoutLogListItem['resultType'],
        resultValue: log.resultValue,
        rpe: log.rpe,
        notes: log.notes,
      }));
  }
}

function toLogDto(log: {
  id: string;
  assignmentId: string;
  resultType: string;
  resultValue: string;
  rpe: number | null;
  notes: string | null;
}): WorkoutLog {
  return {
    id: log.id,
    assignmentId: log.assignmentId,
    resultType: log.resultType as WorkoutLog['resultType'],
    resultValue: log.resultValue,
    rpe: log.rpe,
    notes: log.notes,
  };
}
