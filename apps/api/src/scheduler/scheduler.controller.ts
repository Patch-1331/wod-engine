import { Controller, Get, Post } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

@Controller()
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('today')
  getToday() {
    return this.schedulerService.getToday(todayIsoDate());
  }

  @Post('today/skip')
  skipToday() {
    return this.schedulerService.skipToday(todayIsoDate());
  }
}
