import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  companyId: string;
};

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummaryReport(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getSummaryReport(user);
  }
}
