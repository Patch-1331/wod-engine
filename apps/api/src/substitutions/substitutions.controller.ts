import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { setSubstitutionRequestSchema } from '@wod-engine/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { validateBody } from '../common/validate';
import { SubstitutionsService } from './substitutions.service';

@Controller('assignments/:assignmentId/substitutions')
export class SubstitutionsController {
  constructor(private readonly substitutionsService: SubstitutionsService) {}

  /**
   * Read before the completion screen renders. Declared above the
   * `:wodMovementId` routes so "rung-changes" is never taken for a movement id.
   */
  @Get('rung-changes')
  proposedRungChanges(
    @CurrentUser() userId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.substitutionsService.proposedRungChanges(userId, assignmentId);
  }

  @Post()
  set(
    @CurrentUser() userId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: unknown,
  ) {
    const { wodMovementId, exerciseId } = validateBody(
      setSubstitutionRequestSchema,
      body,
    );
    return this.substitutionsService.set(
      userId,
      assignmentId,
      wodMovementId,
      exerciseId,
    );
  }

  @Delete(':wodMovementId')
  @HttpCode(204)
  clear(
    @CurrentUser() userId: string,
    @Param('assignmentId') assignmentId: string,
    @Param('wodMovementId') wodMovementId: string,
  ) {
    return this.substitutionsService.clear(userId, assignmentId, wodMovementId);
  }
}
