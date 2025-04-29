import { IsUUID } from 'class-validator';

export class AppointmentIdParamDto {
  @IsUUID()
  appointmentId: string;
}
