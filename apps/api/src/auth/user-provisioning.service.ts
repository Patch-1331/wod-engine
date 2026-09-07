import { Injectable } from '@nestjs/common';
import { progressionLine } from '@wod-engine/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Creates the rows a signed-in user needs before anything else can reference
 * them: their User row (which every per-user foreign key points at) plus the
 * per-user defaults the deploy seed used to create globally — a ScheduleRule
 * and one SkillLevel per progression line.
 *
 * Clerk owns identity, so there is no sign-up hook here; a user simply exists
 * the first time they present a valid token.
 */
@Injectable()
export class UserProvisioningService {
  /**
   * Users provisioned during this process's lifetime. Provisioning is
   * idempotent, so this is purely to keep the common case off the database —
   * a cold cache costs one extra upsert, never a wrong result.
   */
  private readonly known = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  async ensure(userId: string): Promise<void> {
    if (this.known.has(userId)) return;

    await this.prisma.$transaction([
      this.prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId },
      }),
      this.prisma.scheduleRule.upsert({
        where: { userId },
        update: {},
        create: { userId },
      }),
      ...progressionLine.options.map((line) =>
        this.prisma.skillLevel.upsert({
          where: { userId_line: { userId, line } },
          update: {},
          create: { userId, line, rung: 0 },
        }),
      ),
    ]);

    this.known.add(userId);
  }
}
