import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Brackets } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { emitEvent } from '../../common/events/emit-event';
import { DateTime } from 'luxon';
import process from 'process';
import { AppointmentIdParamDto } from './dto/appointment-id-param.dto';
import { Provider } from '../provider/entities/provider.entity';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { ProvidersService } from '../provider/providers.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(forwardRef(() => ProvidersService))
    private readonly providersService: ProvidersService,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly connection: DataSource,
  ) {}

  async createAppointment(
    createDto: CreateAppointmentDto,
    clientTimezone?: string,
  ) {
    const { providerId, patientId, startTime } = createDto;

    // Convert client time (in given timezone) to UTC
    const clientStart = DateTime.fromISO(startTime, {
      zone: clientTimezone ?? process.env.TZ,
    });
    const utcStart = clientStart.toUTC();

    // Get provider to validate duration and time alignment
    const provider = await this.providersService.getProvider(providerId);
    if (!provider) ErrorHelper.throwNotFound('Provider not found');

    const duration = provider.appointmentDuration ?? 30;

    // Validate alignment of start time with duration (e.g., 00, 15, 30, 45)
    const minute = clientStart.minute;
    if (minute % duration !== 0) {
      ErrorHelper.throwBadRequest(
        `Start time must align with ${duration}-minute intervals`,
      );
    }

    // Get availability
    const availability = await this.providersService.getAvailability(
      { providerId },
      { date: utcStart.toISODate() },
      clientTimezone,
    );

    const clientSlotTime = utcStart
      .setZone(clientTimezone ?? process.env.TZ)
      .toFormat('HH:mm');

    if (!availability.availableSlots.includes(clientSlotTime)) {
      ErrorHelper.throwConflict('Selected time slot is not available');
    }

    return await this.connection.transaction(
      'SERIALIZABLE',
      async (manager) => {
        // Already validated earlier, but ensuring within transaction
        const transactionalProvider = await manager.findOne(Provider, {
          where: { id: providerId },
        });
        if (!transactionalProvider)
          ErrorHelper.throwNotFound('Provider not found');

        const utcEnd = utcStart.plus({
          minutes: transactionalProvider.appointmentDuration ?? 30,
        });

        const conflict = await manager
          .getRepository(Appointment)
          .createQueryBuilder('appointment')
          .where('appointment.providerId = :providerId', { providerId })
          .andWhere('appointment.status = :status', { status: 'CONFIRMED' })
          .andWhere(
            new Brackets((qb) => {
              qb.where('appointment.startTime <= :dateToCheck', {
                dateToCheck: utcStart.toJSDate(),
              }).andWhere('appointment.endTime > :dateToCheck', {
                dateToCheck: utcStart.toJSDate(),
              });
            }),
          )
          .getOne();

        if (conflict) ErrorHelper.throwConflict('Time slot already booked');

        const appointment = manager.create(Appointment, {
          patientId,
          providerId,
          startTime: utcStart.toJSDate(),
          endTime: utcEnd.toJSDate(),
          status: 'CONFIRMED',
        });

        const saved = await manager.save(appointment);

        await emitEvent('APPOINTMENT_CONFIRMED', {
          appointmentId: saved.id,
          patientId,
          providerId,
          appointmentTime: utcStart.toJSDate(),
        });

        return saved;
      },
    );
  }

  async rescheduleAppointment(
    appointmentId: string,
    updateDto: UpdateAppointmentDto,
    clientTimezone?: string,
  ) {
    const { startTime } = updateDto;
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, status: 'CONFIRMED' },
      relations: ['provider'],
    });

    console.log(appointment);

    if (!appointment) {
      ErrorHelper.throwNotFound('Appointment not found or not confirmed');
    }
    // Convert client time (in given timezone) to UTC
    const clientStart = DateTime.fromISO(startTime, {
      zone: clientTimezone ?? process.env.TZ,
    });
    const utcStart = clientStart.toUTC();

    const availability = await this.providersService.getAvailability(
      { providerId: appointment.providerId },
      { date: utcStart.toISODate() },
      clientTimezone,
    );

    const clientSlotTime = utcStart
      .setZone(clientTimezone ?? process.env.TZ)
      .toFormat('HH:mm');

    if (!availability.availableSlots.includes(clientSlotTime)) {
      ErrorHelper.throwConflict('Selected time slot is not available');
    }

    // Calculate existing appointment duration
    const appointmentLength = DateTime.fromJSDate(appointment.endTime).diff(
      DateTime.fromJSDate(appointment.startTime),
      'minutes',
    ).minutes;

    const newStart = DateTime.fromISO(updateDto.startTime);
    const newEnd = newStart.plus({ minutes: appointmentLength });

    // Check time alignment based on appointment length
    const minute = newStart.minute;
    if (minute % appointmentLength !== 0) {
      ErrorHelper.throwBadRequest(
        `New start time must align with ${appointmentLength}-minute intervals`,
      );
    }

    // Check for time conflict
    const conflict = await this.appointmentRepository.findOne({
      where: {
        providerId: appointment.providerId,
        startTime: newStart.toJSDate(),
        status: 'CONFIRMED',
      },
    });

    if (conflict) ErrorHelper.throwConflict('New time slot already booked');

    const previousAppointmentTime = appointment.startTime;

    appointment.startTime = newStart.toJSDate();
    appointment.endTime = newEnd.toJSDate();

    const updated = await this.appointmentRepository.save(appointment);

    const event = {
      eventId: `evt_unique_${Math.random().toString(36).substring(2, 8)}`,
      eventType: 'APPOINTMENT_RESCHEDULED',
      timestamp: new Date().toISOString(),
      payload: {
        appointmentId: updated.id,
        patientId: updated.patientId,
        providerId: updated.providerId,
        newAppointmentTime: newStart.toJSDate().toISOString(),
        previousAppointmentTime: previousAppointmentTime.toISOString(),
      },
    };
    await emitEvent(event.eventType, event.payload);

    return {
      message: 'Appointment rescheduled successfully',
      appointment: updated.startTime,
    };
  }

  async cancelAppointment(params: AppointmentIdParamDto) {
    const { appointmentId } = params;
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, status: 'CONFIRMED' },
    });
    if (!appointment)
      ErrorHelper.throwNotFound('Appointment not found or already cancelled');

    appointment.status = 'CANCELLED';
    const cancelled = await this.appointmentRepository.save(appointment);

    const event = {
      eventId: `evt_unique_${Math.random().toString(36).substring(2, 8)}`,
      eventType: 'APPOINTMENT_CANCELLED',
      timestamp: new Date().toISOString(),
      payload: {
        appointmentId: cancelled.id,
        reason: 'PATIENT_REQUEST',
      },
    };
    await emitEvent(event.eventType, event.payload);

    return { message: 'Appointment cancelled successfully' };
  }

  async getAppointmentByProviderIdWithDateInterval(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.appointmentRepository.find({
      where: {
        providerId,
        status: 'CONFIRMED',
        startTime: Between(startDate, endDate),
      },
    });
  }
}
