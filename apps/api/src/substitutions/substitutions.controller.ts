import {
  Body,
  Controller,
  Delete,
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
