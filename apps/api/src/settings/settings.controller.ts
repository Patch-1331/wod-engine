import { Body, Controller, Get, Patch } from '@nestjs/common';
import { updateSettingsSchema } from '@wod-engine/shared';
import { validateBody } from '../common/validate';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get() {
    return this.settingsService.get();
  }

  @Patch()
  update(@Body() body: unknown) {
    const { warmupCooldownEnabled } = validateBody(updateSettingsSchema, body);
    return this.settingsService.update(warmupCooldownEnabled);
  }
}
