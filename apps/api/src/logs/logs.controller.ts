import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { logResultRequestSchema } from '@wod-engine/shared';
import { validateBody } from '../common/validate';
import { LogsService } from './logs.service';

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('logs')
  list() {
    return this.logsService.list();
  }

  @Get('assignments/:assignmentId/log')
  getForAssignment(@Param('assignmentId') assignmentId: string) {
    return this.logsService.getForAssignment(assignmentId);
  }

  @Post('assignments/:assignmentId/log')
  upsert(@Param('assignmentId') assignmentId: string, @Body() body: unknown) {
    const parsed = validateBody(logResultRequestSchema, body);
    return this.logsService.upsert(assignmentId, parsed);
  }
}
