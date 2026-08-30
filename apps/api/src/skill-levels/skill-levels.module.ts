import { Module } from '@nestjs/common';
import { SkillLevelsController } from './skill-levels.controller';
import { SkillLevelsService } from './skill-levels.service';

@Module({
  controllers: [SkillLevelsController],
  providers: [SkillLevelsService],
})
export class SkillLevelsModule {}
