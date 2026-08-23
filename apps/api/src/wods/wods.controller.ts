import { Controller, Get } from '@nestjs/common';
import { WodsService } from './wods.service';

@Controller('wods')
export class WodsController {
  constructor(private readonly wodsService: WodsService) {}

  @Get()
  findAll() {
    return this.wodsService.findAll();
  }
}
