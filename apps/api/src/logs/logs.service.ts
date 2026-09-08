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
import { computeRungChanges } from './advancement.logic';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates or replaces the log for an assignment, and marks it completed.
   * The advancement rule only fires on first creation — editing an already-
   * logged result (fixing a typo, adding notes later) doesn't re-run it,
   * since re-running against a rung that already moved would double-advance.
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

    const isFirstLog =
      (await this.prisma.workoutLog.findFirst({
        where: { assignmentId, userId },
      })) === null;

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

    if (isFirstLog && assignment.session) {
      await this.applyAdvancement(
        userId,
        assignment.wod.movements,
        assignment.session,
      );
    }

    return toLogDto(log);
  }

  /** Advances or drops progression lines (Feature #2) per the 3x8-to-3x5 rule. */
  private async applyAdvancement(
    userId: string,
    movements: {
      reps: number;
      repScheme: number[];
      exercise: { line: string | null; unit: string };
    }[],
    session: { roundSplits: string; roundSplitCount: number | null },
  ): Promise<void> {
    const completedRounds = (JSON.parse(session.roundSplits) as unknown[])
      .length;

    const [skillLevels, linedExercises] = await Promise.all([
      this.prisma.skillLevel.findMany({ where: { userId } }),
      this.prisma.exercise.findMany({ where: { line: { not: null } } }),
    ]);

    const currentRung = new Map(skillLevels.map((s) => [s.line, s.rung]));
    const maxRungByLine = new Map<string, number>();
    for (const e of linedExercises) {
      if (!e.line || e.rung === null) continue;
      maxRungByLine.set(
        e.line,
        Math.max(maxRungByLine.get(e.line) ?? 0, e.rung),
      );
    }

    const changes = computeRungChanges(
      movements,
      completedRounds,
      session.roundSplitCount,
      currentRung,
      maxRungByLine,
    );

    await Promise.all(
      changes.map((c) =>
        this.prisma.skillLevel.update({
          where: { userId_line: { userId, line: c.line } },
          data: {
            rung: c.to,
            lastChange: c.to > c.from ? 'advanced' : 'dropped',
          },
        }),
      ),
    );
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
