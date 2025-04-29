import { validate } from 'class-validator';
import { UpdateAppointmentDto } from './update-appointment.dto';
import { describe, it, expect } from 'vitest';

describe('UpdateAppointmentDto', () => {
  it('should pass validation with a valid ISO 8601 date', async () => {
    const dto = new UpdateAppointmentDto();
    dto.startTime = '2025-05-22T10:00:00Z'; // Valid ISO 8601 date

    const errors = await validate(dto);

    expect(errors.length).toBe(0); // No validation errors
  });

  it('should fail validation when startTime is not a valid ISO 8601 date', async () => {
    const dto = new UpdateAppointmentDto();
    dto.startTime = 'invalid-date'; // Invalid date

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].property).toBe('startTime'); // Error is for startTime
  });

  it('should fail validation when startTime is missing', async () => {
    const dto = new UpdateAppointmentDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].property).toBe('startTime'); // Error is for startTime
  });
});
