import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointment.service';
import { AppointmentIdParamDto } from './dto/appointment-id-param.dto';
import { TimezoneHeaderDto } from './dto/timezone-header.dto';

@ApiTags('Appointments')
@Controller('api/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Book an Appointment' })
  @ApiHeader({
    name: 'Timezone',
    required: false,
    description: 'Optional IANA timezone (e.g., America/New_York)',
  })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully.' })
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Headers() headers: TimezoneHeaderDto,
  ) {
    const timezone = headers['timezone'];
    return this.appointmentsService.createAppointment(
      createAppointmentDto,
      timezone,
    );
  }

  @Put(':appointmentId')
  @ApiOperation({ summary: 'Reschedule an Appointment' })
  @ApiHeader({
    name: 'Timezone',
    required: false,
    description: 'Optional IANA timezone (e.g., Asia/Tokyo)',
  })
  @ApiParam({ name: 'appointmentId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Appointment rescheduled successfully.',
  })
  async rescheduleAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Headers() headers: TimezoneHeaderDto,
  ) {
    const timezone = headers['timezone'];
    return this.appointmentsService.rescheduleAppointment(
      appointmentId,
      updateAppointmentDto,
      timezone,
    );
  }

  @Delete(':appointmentId')
  @ApiOperation({ summary: 'Cancel an Appointment' })
  @ApiParam({ name: 'appointmentId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully.',
  })
  async cancelAppointment(@Param() params: AppointmentIdParamDto) {
    return this.appointmentsService.cancelAppointment(params);
  }
}
