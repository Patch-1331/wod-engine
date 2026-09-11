import { Injectable } from '@nestjs/common';
import type { Exercise } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSessionDto } from '../sessions/session.mapper';
import { WodsService } from '../wods/wods.service';
import {
  applyCurrentRung,
  applySubstitutions,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly wodsService: WodsService,
  ) {}

  /** Returns today's assignment, generating one if the day hasn't been decided yet. */
  async getToday(userId: string, today: string) {
    const rule = await this.prisma.scheduleRule.findUnique({
      where: { userId },
    });
    const warmupCooldownEnabled = rule?.warmupCooldownEnabled ?? false;

    const existing = await this.prisma.dailyAssignment.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { wod: { include: wodInclude }, session: true },
    });

    if (existing) {
      const assignment =
        existing.status === 'skipped' || !existing.wod
          ? null
          : {
              id: existing.id,
              date: existing.date,
              status: existing.status,
              wod: await this.scaleWodToCurrentRung(
                userId,
                existing.id,
                existing.wod,
              ),
              session: existing.session ? toSessionDto(existing.session) : null,
            };

      return {
        date: today,
        isRestDay: existing.status === 'skipped',
        assignment,
        warmupCooldownEnabled,
        ...(await this.getChecklistsFor(
          warmupCooldownEnabled,
          assignment?.wod.dominantPattern,
        )),
      };
    }

    const { start } = getWeekRange(today);
    const assignedThisWeek = await this.prisma.dailyAssignment.count({
      where: {
        userId,
        date: { gte: start, lt: today },
        status: { in: ['scheduled', 'in_progress', 'completed'] },
      },
    });

    const maxDaysPerWeek = rule?.maxDaysPerWeek ?? 5;
    const cooldownDays = rule?.patternCooldownDays ?? 5;

    if (isRestDay(assignedThisWeek, maxDaysPerWeek)) {
      return {
        date: today,
        isRestDay: true,
        assignment: null,
        warmupCooldownEnabled,
        warmup: null,
        cooldown: null,
      };
    }

    const wod = await this.generateWodForDate(userId, today, cooldownDays);

    const created = await this.prisma.dailyAssignment.create({
      data: { userId, date: today, wodId: wod.id, status: 'scheduled' },
      include: { wod: { include: wodInclude } },
    });

    const scaledWod = await this.scaleWodToCurrentRung(
      userId,
      created.id,
      created.wod!,
    );

    return {
      date: today,
      isRestDay: false,
      assignment: {
        id: created.id,
        date: created.date,
        status: created.status,
        // wodId was just set from a freshly-picked candidate, so the relation is present.
        wod: scaledWod,
        session: null,
      },
      warmupCooldownEnabled,
      ...(await this.getChecklistsFor(
        warmupCooldownEnabled,
        scaledWod.dominantPattern,
      )),
    };
  }

  /** Null lists when the setting is off or there's no WOD to build a checklist for. */
  private async getChecklistsFor(
    warmupCooldownEnabled: boolean,
    dominantPattern: string | undefined,
  ) {
    if (!warmupCooldownEnabled || !dominantPattern) {
      return { warmup: null, cooldown: null };
    }
    return this.wodsService.getChecklists(dominantPattern);
  }

  /**
   * Replaces each movement's exercise with the one at the user's current
   * rung on that movement's line (Feature #2) — the Wod row itself is a
   * shared, reusable template, so substitution happens here at read time
   * rather than by mutating WodMovement.
   */
  private async scaleWodToCurrentRung<
    W extends {
      movements: { id: string; exercise: Exercise }[];
    },
  >(userId: string, assignmentId: string, wod: W): Promise<W> {
    const [skillLevels, linedExercises, substitutions] = await Promise.all([
      this.prisma.skillLevel.findMany({ where: { userId } }),
      this.prisma.exercise.findMany({ where: { line: { not: null } } }),
      this.prisma.assignmentSubstitution.findMany({
        where: { userId, assignmentId },
        include: { exercise: true },
      }),
    ]);

    const currentRung = new Map(skillLevels.map((s) => [s.line, s.rung]));
    const exerciseAtRung = new Map(
      linedExercises.map((e) => [`${e.line}:${e.rung}`, e]),
    );

    // The rung is what the app assigned; the swap is what the athlete chose.
    // The athlete wins, so their layer goes on last (WOD-5).
    const atRung = applyCurrentRung(wod.movements, currentRung, exerciseAtRung);
    const swapped = applySubstitutions(
      atRung,
      new Map(substitutions.map((s) => [s.wodMovementId, s.exerciseId])),
      new Map(substitutions.map((s) => [s.exerciseId, s.exercise])),
    );

    // Flagged rather than inferred: once a swap has been applied there is
    // nothing left in the movement to tell it from a plain rung scaling, and
    // the plate needs to know which rows the athlete chose themselves.
    const swappedIds = new Set(substitutions.map((s) => s.wodMovementId));

    return {
      ...wod,
      movements: swapped.map((m) => ({
        ...m,
        isSwapped: swappedIds.has(m.id),
      })),
    };
  }

  /** The scheduler's day-per-week cap, for callers outside the scheduling flow (e.g. the Stats page). */
  async getScheduleCap(userId: string): Promise<{ maxDaysPerWeek: number }> {
    const rule = await this.prisma.scheduleRule.findUnique({
      where: { userId },
    });
    return { maxDaysPerWeek: rule?.maxDaysPerWeek ?? 5 };
  }

  /** Marks today as a rest day — upserts so this works whether or not a WOD was already generated. */
  async skipToday(userId: string, today: string) {
    await this.prisma.dailyAssignment.upsert({
      where: { userId_date: { userId, date: today } },
      update: { status: 'skipped' },
      create: { userId, date: today, status: 'skipped' },
    });
    const rule = await this.prisma.scheduleRule.findUnique({
      where: { userId },
    });
    return {
      date: today,
      isRestDay: true,
      assignment: null,
      warmupCooldownEnabled: rule?.warmupCooldownEnabled ?? false,
      warmup: null,
      cooldown: null,
    };
  }

  private async generateWodForDate(
    userId: string,
    today: string,
    cooldownDays: number,
  ) {
    const [wods, recentAssignments] = await Promise.all([
      this.prisma.wod.findMany({
        select: { id: true, name: true, type: true, dominantPattern: true },
      }),
      this.prisma.dailyAssignment.findMany({
        where: {
          userId,
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
