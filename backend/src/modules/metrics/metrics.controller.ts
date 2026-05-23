import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MetricsService } from './metrics.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  companyId: string;
};

@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('files')
  getFilesMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.metricsService.getFilesMetrics(user);
  }

  @Get('sales')
  getSalesMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.metricsService.getSalesMetrics(user);
  }

  @Get('errors')
  getErrorsMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.metricsService.getErrorsMetrics(user);
  }
}
