import { Controller, Get } from '@nestjs/common';
import { Public } from './common/public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Render's health check can't send an auth header.
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
