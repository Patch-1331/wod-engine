import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
