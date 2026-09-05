import { Injectable } from '@nestjs/common';
import type { Settings } from '@wod-engine/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<Settings> {
    const rule = await this.prisma.scheduleRule.findFirst();
    return { warmupCooldownEnabled: rule?.warmupCooldownEnabled ?? false };
  }

  /**
   * Scoped to just this flag — the seed always creates one ScheduleRule
   * row, but toggling before a seed has run shouldn't 404, so this upserts
   * rather than requiring the row to already exist.
   */
  async update(warmupCooldownEnabled: boolean): Promise<Settings> {
    const existing = await this.prisma.scheduleRule.findFirst();

    if (existing) {
      await this.prisma.scheduleRule.update({
        where: { id: existing.id },
        data: { warmupCooldownEnabled },
      });
    } else {
      await this.prisma.scheduleRule.create({
        data: { warmupCooldownEnabled },
      });
    }

    return { warmupCooldownEnabled };
  }
}
