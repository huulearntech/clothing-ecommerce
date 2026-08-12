import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  getOverviewStats(@Query('range') range: '7d' | '30d' | 'ytd') {
    return this.statisticsService.getOverviewStats(range);
  }
}
