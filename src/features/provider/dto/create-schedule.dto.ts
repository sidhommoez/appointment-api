import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

@ValidatorConstraint({ name: 'IsValidWeeklySchedule', async: false })
class IsValidWeeklyScheduleConstraint implements ValidatorConstraintInterface {
  validate(schedule: any, args: ValidationArguments) {
    if (typeof schedule !== 'object' || schedule === null) return false;

    return Object.entries(schedule).every(([day, times]) => {
      if (!WEEKDAYS.includes(day)) return false;

      return !(
        typeof times !== 'object' ||
        times === null ||
        typeof (times as any).start !== 'string' ||
        typeof (times as any).end !== 'string' ||
        !TIME_REGEX.test((times as any).start) ||
        !TIME_REGEX.test((times as any).end)
      );
    });
  }

  defaultMessage(args: ValidationArguments) {
    return `weeklySchedule must contain only valid weekdays with time format HH:mm for 'start' and 'end'`;
  }
}

@ValidatorConstraint({ name: 'IsValidTimezone', async: false })
class IsValidTimezoneConstraint implements ValidatorConstraintInterface {
  validate(timezone: any, args: ValidationArguments) {
    if (typeof timezone !== 'string') return false;

    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `'${args.value}' is not a valid IANA timezone identifier`;
  }
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Weekly schedule with start and end times for each weekday',
    example: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
    },
  })
  @Validate(IsValidWeeklyScheduleConstraint)
  weeklySchedule: Record<string, { start: string; end: string }>;

  @ApiProperty({ description: 'Appointment duration in minutes', example: 30 })
  @IsNumber()
  appointmentDuration: number;

  @ApiProperty({
    description: 'Timezone identifier',
    example: 'America/New_York',
  })
  @IsString()
  @Validate(IsValidTimezoneConstraint)
  timezone: string;
}
