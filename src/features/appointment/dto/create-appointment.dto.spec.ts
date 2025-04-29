import { validate } from 'class-validator';
import { CreateAppointmentDto } from './create-appointment.dto';
import { describe, it, expect } from 'vitest';

describe('CreateAppointmentDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new CreateAppointmentDto();
    dto.patientId = 'pat_xyz_789';
    dto.providerId = 'prov_doc_456';
    dto.startTime = '2025-05-20T14:30:00Z'; // Future ISO 8601 date

    const errors = await validate(dto);

    expect(errors.length).toBe(0); // No validation errors
  });

  it('should fail validation when patientId is missing', async () => {
    const dto = new CreateAppointmentDto();
    dto.providerId = 'prov_doc_456';
    dto.startTime = '2025-05-20T14:30:00Z';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('patientId');
  });

  it('should fail validation when providerId is missing', async () => {
    const dto = new CreateAppointmentDto();
    dto.patientId = 'pat_xyz_789';
    dto.startTime = '2025-05-20T14:30:00Z';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('providerId');
  });

  it('should fail validation when startTime is not a valid ISO 8601 date', async () => {
    const dto = new CreateAppointmentDto();
    dto.patientId = 'pat_xyz_789';
    dto.providerId = 'prov_doc_456';
    dto.startTime = 'invalid-date';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('startTime');
  });

  it('should fail validation when startTime is not a future date', async () => {
    const dto = new CreateAppointmentDto();
    dto.patientId = 'pat_xyz_789';
    dto.providerId = 'prov_doc_456';
    dto.startTime = new Date().toISOString(); // Current date, not in the future

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isFutureDate).toBeDefined();
  });
});
