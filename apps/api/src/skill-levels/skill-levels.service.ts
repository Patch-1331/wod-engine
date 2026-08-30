import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SkillLevel } from '@wod-engine/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillLevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SkillLevel[]> {
    const rows = await this.prisma.skillLevel.findMany({ orderBy: { line: 'asc' } });
    return rows.map(toDto);
  }

  /**
   * Manual override — lets the user correct a rung the automatic 3x8-to-3x5
   * rule (#7) got wrong. Bounded to a rung that actually has an exercise
   * seeded for this line, same ceiling the automatic rule respects, so the
   * scheduler substitution (#6) never has to fall back on a missing rung.
   */
  async setRung(line: string, rung: number): Promise<SkillLevel> {
    const existing = await this.prisma.skillLevel.findUnique({ where: { line } });
    if (!existing) throw new NotFoundException(`No skill level tracked for line "${line}"`);

    const maxRung = await this.prisma.exercise.aggregate({
      where: { line },
      _max: { rung: true },
    });
    const ceiling = maxRung._max.rung ?? 0;
    if (rung > ceiling) {
      throw new BadRequestException(
        `Line "${line}" has no exercise seeded at rung ${rung} (max is ${ceiling})`,
      );
    }

    const updated = await this.prisma.skillLevel.update({
      where: { line },
      data: { rung },
    });
    return toDto(updated);
  }
}

function toDto(row: {
  id: string;
  line: string;
  rung: number;
  updatedAt: Date;
}): SkillLevel {
  return {
    id: row.id,
    line: row.line as SkillLevel['line'],
    rung: row.rung,
    updatedAt: row.updatedAt.toISOString(),
  };
}
