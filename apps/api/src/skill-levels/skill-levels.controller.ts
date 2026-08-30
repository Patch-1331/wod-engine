import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { setSkillLevelRequestSchema } from '@wod-engine/shared';
import { validateBody } from '../common/validate';
import { SkillLevelsService } from './skill-levels.service';

@Controller('skill-levels')
export class SkillLevelsController {
  constructor(private readonly skillLevelsService: SkillLevelsService) {}

  @Get()
  findAll() {
    return this.skillLevelsService.findAll();
  }

  @Patch(':line')
  setRung(@Param('line') line: string, @Body() body: unknown) {
    const { rung } = validateBody(setSkillLevelRequestSchema, body);
    return this.skillLevelsService.setRung(line, rung);
  }
}
