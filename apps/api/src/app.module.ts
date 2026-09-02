import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WodsModule } from './wods/wods.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SessionsModule } from './sessions/sessions.module';
import { LogsModule } from './logs/logs.module';
import { SkillLevelsModule } from './skill-levels/skill-levels.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    ExercisesModule,
    WodsModule,
    SchedulerModule,
    SessionsModule,
    LogsModule,
    SkillLevelsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
