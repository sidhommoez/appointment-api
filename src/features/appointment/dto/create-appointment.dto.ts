import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsISO8601,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  IsUUID,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments) {
    return new Date(value) > new Date();
  }

  defaultMessage(_args: ValidationArguments) {
    return 'startTime must be a future date';
  }
}

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient ID', example: 'pat_xyz_789' })
  @IsString()
  patientId: string;

  @ApiProperty({
    description: 'Provider ID',
    example: '65101976-df2f-416c-a478-c4fe890e364d',
  })
  @IsUUID()
  providerId: string;

  @ApiProperty({
    description: 'Start time in ISO 8601 format',
    example: '2025-05-20T14:30:00Z',
  })
  @IsISO8601()
  @Validate(IsFutureDateConstraint)
  startTime: string;
}
