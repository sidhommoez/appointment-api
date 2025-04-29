import { validate } from 'class-validator';
import { AvailabilityDateDto } from './get-availability-date.dto';
import { describe, it, expect } from 'vitest';

describe('AvailabilityDateDto', () => {
  it('should pass validation with a valid ISO 8601 date', async () => {
    const dto = new AvailabilityDateDto();
    dto.date = '2025-05-20'; // Valid ISO 8601 date

    const errors = await validate(dto);

    expect(errors.length).toBe(0); // No validation errors
  });

  it('should fail validation when date is not a valid ISO 8601 date', async () => {
    const dto = new AvailabilityDateDto();
    dto.date = 'invalid-date'; // Invalid date

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].property).toBe('date'); // Error is for the date field
    expect(errors[0].constraints?.isDateString).toBeDefined(); // Specific constraint error
  });

  it('should fail validation when date is missing', async () => {
    const dto = new AvailabilityDateDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].property).toBe('date'); // Error is for the date field
    expect(errors[0].constraints?.isDateString).toBeDefined(); // Specific constraint error
  });
});
