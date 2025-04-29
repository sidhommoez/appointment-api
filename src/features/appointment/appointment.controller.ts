import { Controller, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {AppointmentsService} from "./appointment.service";
import {AppointmentIdParamDto} from "./dto/appointment-id-param.dto";

@ApiTags('Appointments')
@Controller('api/appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {}

    @Post()
    @ApiOperation({ summary: 'Book an Appointment' })
    @ApiResponse({ status: 201, description: 'Appointment booked successfully.' })
    async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
        return this.appointmentsService.createAppointment(createAppointmentDto);
    }

    @Put(':appointmentId')
    @ApiOperation({ summary: 'Reschedule an Appointment' })
    @ApiParam({ name: 'appointmentId', required: true })
    @ApiResponse({ status: 200, description: 'Appointment rescheduled successfully.' })
    async rescheduleAppointment(
        @Param('appointmentId') appointmentId: string,
        @Body() updateAppointmentDto: UpdateAppointmentDto,
    ) {
        return this.appointmentsService.rescheduleAppointment(appointmentId, updateAppointmentDto);
    }

    @Delete(':appointmentId')
    @ApiOperation({ summary: 'Cancel an Appointment' })
    @ApiParam({ name: 'appointmentId', required: true })
    @ApiResponse({ status: 200, description: 'Appointment cancelled successfully.' })
    async cancelAppointment(@Param() params: AppointmentIdParamDto) {
        return this.appointmentsService.cancelAppointment(params);
    }
}
