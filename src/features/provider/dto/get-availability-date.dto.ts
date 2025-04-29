import { IsDateString } from 'class-validator';

export class AvailabilityDateDto {
  @IsDateString(
    {},
    { message: 'Date must be in a valid ISO 8601 format (YYYY-MM-DD).' },
  )
  date: string;
}
