import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  logRoundSplitSchema,
  setRoundSplitRequestSchema,
} from '@wod-engine/shared';
import { validateBody } from '../common/validate';
import { SessionsService } from './sessions.service';

@Controller('assignments/:assignmentId/session')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  get(@Param('assignmentId') assignmentId: string) {
    return this.sessionsService.get(assignmentId);
  }

  @Post()
  start(@Param('assignmentId') assignmentId: string) {
    return this.sessionsService.start(assignmentId);
  }

  @Post('rounds')
  logRound(@Param('assignmentId') assignmentId: string, @Body() body: unknown) {
    const round = validateBody(logRoundSplitSchema, body);
    return this.sessionsService.logRound(assignmentId, round);
  }

  @Post('finish')
  finish(@Param('assignmentId') assignmentId: string) {
    return this.sessionsService.finish(assignmentId);
  }

  @Post('split')
  setRoundSplit(
    @Param('assignmentId') assignmentId: string,
    @Body() body: unknown,
  ) {
    const { roundSplitCount } = validateBody(setRoundSplitRequestSchema, body);
    return this.sessionsService.setRoundSplit(assignmentId, roundSplitCount);
  }
}
