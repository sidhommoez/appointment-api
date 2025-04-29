import type { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthCheckService: HealthCheckService;

  beforeEach(() => {
    healthCheckService = {
      check: vi.fn().mockResolvedValue({
        status: 'ok',
        info: { API: { status: 'up' } },
        error: {},
        details: { API: { status: 'up' } },
      } as HealthCheckResult),
    } as unknown as HealthCheckService;

    healthController = new HealthController(healthCheckService);
  });

  it('should return health check result', async () => {
    const result = await healthController.check();
    expect(result).toEqual({
      status: 'ok',
      info: { API: { status: 'up' } },
      error: {},
      details: { API: { status: 'up' } },
    });
    expect(healthCheckService.check).toHaveBeenCalled();
  });
});
