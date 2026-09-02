import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildCooldownChecklist,
  buildWarmupChecklist,
} from './checklist.logic';

@Injectable()
export class WodsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.wod.findMany({
      include: {
        movements: { include: { exercise: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Warm-up/cool-down checklists for a WOD's dominant pattern (Feature #63). */
  async getChecklists(dominantPattern: string) {
    const pool = await this.prisma.exercise.findMany({
      where: { phase: { not: null } },
      select: { id: true, name: true, pattern: true, phase: true },
    });

    return {
      warmup: buildWarmupChecklist(pool, dominantPattern),
      cooldown: buildCooldownChecklist(pool, dominantPattern),
    };
  }
}
