import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  LogResultRequest,
  WorkoutLog,
  WorkoutLogListItem,
} from '@wod-engine/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates or replaces the log for an assignment, and marks it completed. */
  async upsert(
    assignmentId: string,
    body: LogResultRequest,
  ): Promise<WorkoutLog> {
    const assignment = await this.prisma.dailyAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (!assignment.wodId)
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
      create: { assignmentId, ...data },
    });

    await this.prisma.dailyAssignment.update({
      where: { id: assignmentId },
      data: { status: 'completed' },
    });

    return toLogDto(log);
  }

  async getForAssignment(assignmentId: string): Promise<WorkoutLog | null> {
    const log = await this.prisma.workoutLog.findUnique({
      where: { assignmentId },
    });
    return log ? toLogDto(log) : null;
  }

  async list(): Promise<WorkoutLogListItem[]> {
    const logs = await this.prisma.workoutLog.findMany({
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
