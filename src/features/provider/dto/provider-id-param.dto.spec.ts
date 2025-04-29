import { validate } from 'class-validator';
import { ProviderIdParamDto } from './provider-id-param.dto';
import { describe, it, expect } from 'vitest';

describe('ProviderIdParamDto', () => {
  it('should pass validation when providerId is a valid UUID', async () => {
    const dto = new ProviderIdParamDto();
    dto.providerId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID

    const errors = await validate(dto);

    expect(errors.length).toBe(0); // No validation errors
  });

  it('should fail validation when providerId is not a valid UUID', async () => {
    const dto = new ProviderIdParamDto();
    dto.providerId = 'invalid-uuid'; // Invalid UUID

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].constraints?.isUuid).toBeDefined(); // Specific UUID error
  });

  it('should fail validation when providerId is missing', async () => {
    const dto = new ProviderIdParamDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].constraints?.isUuid).toBeDefined(); // Specific UUID error
  });
});
