import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  getRoot() {
    return 'CloudFileOps API running';
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: this.configService.get<string>('appName'),
      environment: this.configService.get<string>('nodeEnv'),
    };
  }

  @Get('db/health')
  async getDatabaseHealth() {
    await this.prismaService.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
    };
  }
}
