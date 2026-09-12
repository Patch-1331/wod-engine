import { Injectable } from '@nestjs/common';
import type { Settings, UpdateSettings } from '@regimen-works/shared';
import type { ScheduleRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Defaults for a user with no ScheduleRule row yet. They mirror the column
 * defaults in schema.prisma rather than restating a policy: warm-up/cool-down
 * is opt-in (#63), stopping at the time cap is how the timer runs unless the
 * athlete opts out.
 */
const DEFAULTS: Settings = {
  warmupCooldownEnabled: false,
  autoStopAtCapEnabled: true,
};

function toSettings(rule: ScheduleRule | null): Settings {
  if (!rule) return DEFAULTS;
  return {
    warmupCooldownEnabled: rule.warmupCooldownEnabled,
    autoStopAtCapEnabled: rule.autoStopAtCapEnabled,
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<Settings> {
    const rule = await this.prisma.scheduleRule.findUnique({
      where: { userId },
    });
    return toSettings(rule);
  }

  /**
   * Applies only the toggles present in `patch`, so one switch never writes
   * another's value back. Provisioning creates a ScheduleRule on first
   * sign-in, but this still upserts so a toggle can't 404 on a user whose row
   * is somehow absent; the fields it omits land on their column defaults.
   *
   * Returns the row as written rather than echoing the patch — with a partial
   * body that's the only answer that includes the toggles left alone.
   */
  async update(userId: string, patch: UpdateSettings): Promise<Settings> {
    const rule = await this.prisma.scheduleRule.upsert({
      where: { userId },
      update: patch,
      create: { userId, ...patch },
    });

    return toSettings(rule);
  }
}
