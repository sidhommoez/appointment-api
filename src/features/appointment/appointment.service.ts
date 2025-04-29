import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { emitEvent } from '../../common/events/emit-event';
import { DateTime } from 'luxon';
import process from 'process';
import { AppointmentIdParamDto } from './dto/appointment-id-param.dto';
import { Provider } from '../provider/entities/provider.entity';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly connection: DataSource,
    ) {}

    // Helper method to throw NotFoundException
    private throwNotFound(message: string): never {
        throw new NotFoundException(message);
    }

    // Helper method to throw ConflictException
    private throwConflict(message: string): never {
        throw new ConflictException(message);
    }

    async createAppointment(createDto: CreateAppointmentDto, clientTimezone?: string) {
        const { providerId, patientId, startTime } = createDto;

        // Convert client time (in given timezone) to UTC
        const clientStart = DateTime.fromISO(startTime, { zone: clientTimezone ?? process.env.TZ });
        const utcStart = clientStart.toUTC();

        return await this.connection.transaction('SERIALIZABLE', async (manager) => {
            const provider = await manager.findOne(Provider, { where: { id: providerId } });
            if (!provider) this.throwNotFound('Provider not found');

            const utcEnd = utcStart.plus({ minutes: provider.appointmentDuration ?? 30 });

            const conflict = await manager
                .getRepository(Appointment)
                .createQueryBuilder('appointment')
                .where('appointment.providerId = :providerId', { providerId })
                .andWhere('appointment.status = :status', { status: 'CONFIRMED' })
                .andWhere(':dateToCheck BETWEEN appointment.startTime AND appointment.endTime', {
                    dateToCheck: utcStart.toJSDate(),
                })
                .getOne();

            if (conflict) this.throwConflict('Time slot already booked');

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
        });
    }

    async rescheduleAppointment(appointmentId: string, updateDto: UpdateAppointmentDto) {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId, status: 'CONFIRMED' },
        });
        if (!appointment) this.throwNotFound('Appointment not found or not confirmed');

        const newStart = new Date(updateDto.startTime);
        const newEnd = new Date(newStart.getTime() + 30 * 60000);

        const conflict = await this.appointmentRepository.findOne({
            where: {
                providerId: appointment.providerId,
                startTime: newStart,
                status: 'CONFIRMED',
            },
        });

        if (conflict) this.throwConflict('New time slot already booked');

        appointment.startTime = newStart;
        appointment.endTime = newEnd;
        const updated = await this.appointmentRepository.save(appointment);

        await emitEvent('APPOINTMENT_RESCHEDULED', {
            appointmentId: updated.id,
            patientId: updated.patientId,
            providerId: updated.providerId,
            previousAppointmentTime: appointment.startTime,
            newAppointmentTime: newStart,
        });

        return updated;
    }

    async cancelAppointment(params: AppointmentIdParamDto) {
        const { appointmentId } = params;
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId, status: 'CONFIRMED' },
        });
        if (!appointment) this.throwNotFound('Appointment not found or already cancelled');

        appointment.status = 'CANCELLED';
        const cancelled = await this.appointmentRepository.save(appointment);

        await emitEvent('APPOINTMENT_CANCELLED', {
            appointmentId: cancelled.id,
            reason: 'PATIENT_REQUEST',
        });

        return cancelled;
    }

    async getAppointmentByProviderIdWithDateInterval(providerId: string, startDate: Date, endDate: Date) {
        return this.appointmentRepository.find({
            where: {
                providerId,
                status: 'CONFIRMED',
                startTime: Between(startDate, endDate),
            },
        });
    }
}
