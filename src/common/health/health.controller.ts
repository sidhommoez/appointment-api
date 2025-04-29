import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private readonly _healthCheckService: HealthCheckService) {}

  @Get('liveness')
  @HealthCheck()
  public async check(): Promise<HealthCheckResult> {
    return this._healthCheckService.check([
      (): HealthIndicatorResult => ({
        API: { status: 'up' },
      }),
    ]);
  }
}
