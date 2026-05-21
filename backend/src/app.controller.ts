import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

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
}
