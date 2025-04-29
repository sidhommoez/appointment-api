import { validate } from 'class-validator';
import { CreateScheduleDto } from './create-schedule.dto';
import { describe, it, expect } from 'vitest';

describe('CreateScheduleDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new CreateScheduleDto();
    dto.weeklySchedule = {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
    };
    dto.appointmentDuration = 30;
    dto.timezone = 'America/New_York';

    const errors = await validate(dto);

    expect(errors.length).toBe(0); // No validation errors
  });

  it('should fail validation when weeklySchedule is invalid', async () => {
    const dto = new CreateScheduleDto();
    dto.weeklySchedule = {
      invalidDay: { start: '09:00', end: '17:00' }, // Invalid weekday
    };
    dto.appointmentDuration = 30;
    dto.timezone = 'America/New_York';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.IsValidWeeklySchedule).toBeDefined();
  });

  it('should fail validation when appointmentDuration is not a number', async () => {
    const dto = new CreateScheduleDto();
    dto.weeklySchedule = {
      monday: { start: '09:00', end: '17:00' },
    };
    dto.appointmentDuration = 'invalid' as any; // Invalid type
    dto.timezone = 'America/New_York';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('appointmentDuration');
  });

  it('should fail validation when timezone is invalid', async () => {
    const dto = new CreateScheduleDto();
    dto.weeklySchedule = {
      monday: { start: '09:00', end: '17:00' },
    };
    dto.appointmentDuration = 30;
    dto.timezone = 'Invalid/Timezone'; // Invalid timezone

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.IsValidTimezone).toBeDefined();
  });

  it('should fail validation when weeklySchedule is missing', async () => {
    const dto = new CreateScheduleDto();
    dto.appointmentDuration = 30;
    dto.timezone = 'America/New_York';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('weeklySchedule');
  });

  it('should fail validation when timezone is missing', async () => {
    const dto = new CreateScheduleDto();
    dto.weeklySchedule = {
      monday: { start: '09:00', end: '17:00' },
    };
    dto.appointmentDuration = 30;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('timezone');
  });
});
