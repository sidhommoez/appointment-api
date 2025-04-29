import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Provider } from './entities/provider.entity';
import { Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { AppointmentsService } from '../appointment/appointment.service';
import { ProviderIdParamDto } from './dto/provider-id-param.dto';
import { DateTime } from 'luxon';
import { AvailabilityDateDto } from './dto/get-availability-date.dto';
import process from 'process';
import { ErrorHelper } from '../../common/helpers/error.helper';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async upsertSchedule(
    params: ProviderIdParamDto,
    dto: CreateScheduleDto,
  ): Promise<{ message: string }> {
    const { providerId } = params;

    if (!dto.weeklySchedule || !dto.timezone) {
      ErrorHelper.throwBadRequest('Invalid schedule data or timezone');
    }

    const weeklyScheduleUTC: Record<string, { start: string; end: string }> =
      {};

    for (const [day, times] of Object.entries(dto.weeklySchedule)) {
      if (!times.start || !times.end) {
        ErrorHelper.throwBadRequest(`Invalid schedule for ${day}`);
      }

      const exampleDate = DateTime.fromObject(
        { weekday: getWeekdayNumber(day), hour: 0 },
        { zone: dto.timezone },
      );

      const startUTC = DateTime.fromISO(
        `${exampleDate.toISODate()}T${times.start}`,
        { zone: dto.timezone },
      )
        .toUTC()
        .toFormat('HH:mm');
      const endUTC = DateTime.fromISO(
        `${exampleDate.toISODate()}T${times.end}`,
        { zone: dto.timezone },
      )
        .toUTC()
        .toFormat('HH:mm');

      weeklyScheduleUTC[day.toLowerCase()] = { start: startUTC, end: endUTC };
    }

    const provider = this.providerRepository.create({
      id: providerId,
      weeklySchedule: weeklyScheduleUTC,
      appointmentDuration: dto.appointmentDuration,
      timezone: dto.timezone,
    });

    await this.providerRepository.save({ ...provider });

    return { message: 'Schedule created/updated successfully' };
  }

  async getAvailability(
    providerIdParam: ProviderIdParamDto,
    dateQuery: AvailabilityDateDto,
    clientTimezone?: string,
  ): Promise<{ providerId: string; date: string; availableSlots: string[] }> {
    const { providerId } = providerIdParam;
    const { date } = dateQuery;

    if (!date) {
      ErrorHelper.throwBadRequest('Date is required');
    }

    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });
    if (!provider) {
      ErrorHelper.throwNotFound('Provider not found');
    }

    const dayName = DateTime.fromISO(date).toFormat('cccc').toLowerCase();
    const schedule = provider.weeklySchedule[dayName];
    if (!schedule) {
      return { providerId, date, availableSlots: [] };
    }

    const startUTC = DateTime.fromISO(`${date}T${schedule.start}`, {
      zone: 'utc',
    });
    const endUTC = DateTime.fromISO(`${date}T${schedule.end}`, { zone: 'utc' });

    const appointments =
      await this.appointmentsService.getAppointmentByProviderIdWithDateInterval(
        providerId,
        startUTC.toJSDate(),
        endUTC.toJSDate(),
      );

    const bookedSlots = new Set<string>();
    appointments.forEach((appt) => {
      bookedSlots.add(DateTime.fromJSDate(appt.startTime).toUTC().toISO());
    });

    const availableSlots: string[] = [];
    for (
      let dt = startUTC;
      dt < endUTC;
      dt = dt.plus({ minutes: provider.appointmentDuration })
    ) {
      const iso = dt.toUTC().toISO();
      const localTime = dt
        .setZone(clientTimezone ?? process.env.TZ)
        .toFormat('HH:mm');
      if (!bookedSlots.has(iso)) {
        availableSlots.push(localTime);
      }
    }

    return {
      providerId,
      date,
      availableSlots,
    };
  }

  async getProvider(providerId: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });
    if (!provider) {
      ErrorHelper.throwNotFound('Provider not found');
    }
    return provider;
  }
}

function getWeekdayNumber(day: string): number {
  const weekdays: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };
  return weekdays[day.toLowerCase()] || 0;
}
