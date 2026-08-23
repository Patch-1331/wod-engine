import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.exercise.findMany({
      include: { altExercise: true },
      orderBy: { name: 'asc' },
    });
  }
}
