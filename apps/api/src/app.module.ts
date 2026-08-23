import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WodsModule } from './wods/wods.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SessionsModule } from './sessions/sessions.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    PrismaModule,
    ExercisesModule,
    WodsModule,
    SchedulerModule,
    SessionsModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
