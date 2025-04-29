import { validate } from 'class-validator';
import { AppointmentIdParamDto } from './appointment-id-param.dto';
import { describe, expect, it } from 'vitest';

describe('AppointmentIdParamDto', () => {
  it('should pass validation when appointmentId is a valid UUID', async () => {
    const dto = new AppointmentIdParamDto();
    dto.appointmentId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID

    const errors = await validate(dto);

    expect(errors.length).toBe(0); // No validation errors
  });

  it('should fail validation when appointmentId is not a valid UUID', async () => {
    const dto = new AppointmentIdParamDto();
    dto.appointmentId = 'invalid-uuid'; // Invalid UUID

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].constraints?.isUuid).toBeDefined(); // Specific UUID error
  });

  it('should fail validation when appointmentId is missing', async () => {
    const dto = new AppointmentIdParamDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0); // Validation errors exist
    expect(errors[0].constraints?.isUuid).toBeDefined(); // Specific UUID error
  });
});
