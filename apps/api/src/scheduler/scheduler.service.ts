import { Injectable } from '@nestjs/common';
import type { Exercise } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSessionDto } from '../sessions/session.mapper';
import {
  applyCurrentRung,
  getWeekRange,
  isRestDay,
  pickWod,
  RecentAssignment,
} from './scheduler.logic';

const wodInclude = {
  movements: {
    include: { exercise: true },
    orderBy: { order: 'asc' as const },
  },
};

@Injectable()
export class SchedulerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns today's assignment, generating one if the day hasn't been decided yet. */
  async getToday(today: string) {
    const existing = await this.prisma.dailyAssignment.findUnique({
      where: { date: today },
      include: { wod: { include: wodInclude }, session: true },
    });

    if (existing) {
      return {
        date: today,
        isRestDay: existing.status === 'skipped',
        assignment:
          existing.status === 'skipped' || !existing.wod
            ? null
            : {
                id: existing.id,
                date: existing.date,
                status: existing.status,
                wod: await this.scaleWodToCurrentRung(existing.wod),
                session: existing.session
                  ? toSessionDto(existing.session)
                  : null,
              },
      };
    }

    const { start } = getWeekRange(today);
    const assignedThisWeek = await this.prisma.dailyAssignment.count({
      where: {
        date: { gte: start, lt: today },
        status: { in: ['scheduled', 'in_progress', 'completed'] },
      },
    });

    const rule = await this.prisma.scheduleRule.findFirst();
    const maxDaysPerWeek = rule?.maxDaysPerWeek ?? 5;
    const cooldownDays = rule?.patternCooldownDays ?? 5;

    if (isRestDay(assignedThisWeek, maxDaysPerWeek)) {
      return { date: today, isRestDay: true, assignment: null };
    }

    const wod = await this.generateWodForDate(today, cooldownDays);

    const created = await this.prisma.dailyAssignment.create({
      data: { date: today, wodId: wod.id, status: 'scheduled' },
      include: { wod: { include: wodInclude } },
    });

    return {
      date: today,
      isRestDay: false,
      assignment: {
        id: created.id,
        date: created.date,
        status: created.status,
        // wodId was just set from a freshly-picked candidate, so the relation is present.
        wod: await this.scaleWodToCurrentRung(created.wod!),
        session: null,
      },
    };
  }

  /**
   * Replaces each movement's exercise with the one at the user's current
   * rung on that movement's line (Feature #2) — the Wod row itself is a
   * shared, reusable template, so substitution happens here at read time
   * rather than by mutating WodMovement.
   */
  private async scaleWodToCurrentRung<
    W extends {
      movements: { exercise: Exercise }[];
    },
  >(wod: W): Promise<W> {
    const [skillLevels, linedExercises] = await Promise.all([
      this.prisma.skillLevel.findMany(),
      this.prisma.exercise.findMany({ where: { line: { not: null } } }),
    ]);

    const currentRung = new Map(skillLevels.map((s) => [s.line, s.rung]));
    const exerciseAtRung = new Map(
      linedExercises.map((e) => [`${e.line}:${e.rung}`, e]),
    );

    return {
      ...wod,
      movements: applyCurrentRung(wod.movements, currentRung, exerciseAtRung),
    };
  }

  /** Marks today as a rest day — upserts so this works whether or not a WOD was already generated. */
  async skipToday(today: string) {
    await this.prisma.dailyAssignment.upsert({
      where: { date: today },
      update: { status: 'skipped' },
      create: { date: today, status: 'skipped' },
    });
    return { date: today, isRestDay: true, assignment: null };
  }

  private async generateWodForDate(today: string, cooldownDays: number) {
    const [wods, recentAssignments] = await Promise.all([
      this.prisma.wod.findMany({
        select: { id: true, name: true, type: true, dominantPattern: true },
      }),
      this.prisma.dailyAssignment.findMany({
        where: {
          date: { lt: today },
          status: { in: ['scheduled', 'in_progress', 'completed'] },
        },
        orderBy: { date: 'desc' },
        take: 30,
        select: {
          date: true,
          wod: {
            select: { id: true, name: true, type: true, dominantPattern: true },
          },
        },
      }),
    ]);

    // status filter above guarantees wodId (and so `wod`) is set on every row here,
    // but wodId is nullable at the schema level (for skipped days), so narrow explicitly.
    const history: RecentAssignment[] = recentAssignments
      .filter(
        (a): a is typeof a & { wod: NonNullable<typeof a.wod> } =>
          a.wod !== null,
      )
      .map((a) => ({ date: a.date, wod: a.wod }));
    return pickWod(wods, history, today, cooldownDays, Math.random);
  }
}
