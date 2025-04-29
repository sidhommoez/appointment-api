import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class UpdateAppointmentDto {
    @ApiProperty({ description: 'New start time for the appointment', example: '2025-05-22T10:00:00Z' })
    @IsISO8601()
    startTime: string;
}
