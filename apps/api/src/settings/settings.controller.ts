import { Body, Controller, Get, Patch } from '@nestjs/common';
import { updateSettingsSchema } from '@wod-engine/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { validateBody } from '../common/validate';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@CurrentUser() userId: string) {
    return this.settingsService.get(userId);
  }

  @Patch()
  update(@CurrentUser() userId: string, @Body() body: unknown) {
    const { warmupCooldownEnabled } = validateBody(updateSettingsSchema, body);
    return this.settingsService.update(userId, warmupCooldownEnabled);
  }
}
