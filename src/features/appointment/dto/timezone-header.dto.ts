import {
  IsOptional,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IANAZone } from 'luxon';

export function IsValidTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments): boolean {
          if (typeof value !== 'string') return false;
          return IANAZone.isValidZone(value) as boolean;
        },
        defaultMessage(): string {
          return 'Timezone must be a valid IANA timezone (e.g., America/New_York)';
        },
      },
    });
  };
}

export class TimezoneHeaderDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }): string | undefined =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  @IsValidTimezone({ message: 'Invalid IANA timezone provided.' })
  timezone?: string;
}
