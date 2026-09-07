import { Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SchedulerService } from './scheduler.service';

/**
 * Local calendar date, not UTC — this runs on the user's own machine, and
 * `toISOString()` would return yesterday's date for part of the evening in
 * any timezone ahead of UTC.
 */
function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Controller()
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('today')
  getToday(@CurrentUser() userId: string) {
    return this.schedulerService.getToday(userId, todayIsoDate());
  }

  @Post('today/skip')
  skipToday(@CurrentUser() userId: string) {
    return this.schedulerService.skipToday(userId, todayIsoDate());
  }

  @Get('schedule-rule')
  getScheduleRule(@CurrentUser() userId: string) {
    return this.schedulerService.getScheduleCap(userId);
  }
}
