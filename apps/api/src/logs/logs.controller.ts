import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { logResultRequestSchema } from '@wod-engine/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { validateBody } from '../common/validate';
import { LogsService } from './logs.service';

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('logs')
  list(@CurrentUser() userId: string) {
    return this.logsService.list(userId);
  }

  @Get('assignments/:assignmentId/log')
  getForAssignment(
    @CurrentUser() userId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.logsService.getForAssignment(userId, assignmentId);
  }

  @Post('assignments/:assignmentId/log')
  upsert(
    @CurrentUser() userId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: unknown,
  ) {
    const parsed = validateBody(logResultRequestSchema, body);
    return this.logsService.upsert(userId, assignmentId, parsed);
  }
}
