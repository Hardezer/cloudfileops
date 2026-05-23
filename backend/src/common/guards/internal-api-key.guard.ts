import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const internalApiKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!internalApiKey) {
      throw new UnauthorizedException('Internal API key is not configured');
    }

    const apiKeyHeader = request.headers['x-internal-api-key'];

    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

    if (!apiKey || apiKey !== internalApiKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
