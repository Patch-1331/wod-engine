import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WodsModule } from './wods/wods.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [PrismaModule, ExercisesModule, WodsModule, SchedulerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
