import { Injectable } from '@nestjs/common';
import type { Settings } from '@wod-engine/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<Settings> {
    const rule = await this.prisma.scheduleRule.findUnique({
      where: { userId },
    });
    return { warmupCooldownEnabled: rule?.warmupCooldownEnabled ?? false };
  }

  /**
   * Scoped to just this flag. Provisioning creates a ScheduleRule on first
   * sign-in, but this still upserts so a toggle can't 404 on a user whose row
   * is somehow absent.
   */
  async update(
    userId: string,
    warmupCooldownEnabled: boolean,
  ): Promise<Settings> {
    await this.prisma.scheduleRule.upsert({
      where: { userId },
      update: { warmupCooldownEnabled },
      create: { userId, warmupCooldownEnabled },
    });

    return { warmupCooldownEnabled };
  }
}
