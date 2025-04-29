import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Provider } from './entities/provider.entity';
import { Repository} from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { AppointmentsService} from "../appointment/appointment.service";
import { ProviderIdParamDto} from "./dto/provider-id-param.dto";
import { DateTime } from 'luxon';
import {AvailabilityDateDto} from "./dto/get-availability-date.dto";
import process from "process";

@Injectable()
export class ProvidersService {
    constructor(
        @InjectRepository(Provider)
        private readonly providerRepository: Repository<Provider>,
        private readonly appointmentsService: AppointmentsService,
    ) {}

    async upsertSchedule(params: ProviderIdParamDto, dto: CreateScheduleDto): Promise<{ message: string }> {
        const weeklyScheduleUTC: Record<string, { start: string; end: string }> = {};

        const { providerId } = params;

        for (const [day, times] of Object.entries(dto.weeklySchedule)) {
            const exampleDate = DateTime.fromObject({ weekday: getWeekdayNumber(day), hour: 0 }, { zone: dto.timezone });

            const startUTC = DateTime.fromISO(`${exampleDate.toISODate()}T${times.start}`, { zone: dto.timezone }).toUTC().toFormat('HH:mm');
            const endUTC = DateTime.fromISO(`${exampleDate.toISODate()}T${times.end}`, { zone: dto.timezone }).toUTC().toFormat('HH:mm');

            weeklyScheduleUTC[day.toLowerCase()] = { start: startUTC, end: endUTC };
        }

        const provider = await this.providerRepository.findOne({ where: { id: providerId } });
        const updated = this.providerRepository.create({
            id: providerId,
            weeklySchedule: weeklyScheduleUTC,
            appointmentDuration: dto.appointmentDuration,
            timezone: dto.timezone,
        });

         provider ? await this.providerRepository.save({ ...provider, ...updated }) : await this.providerRepository.save(updated);

        return { message: 'Schedule created/updated successfully' };
    }

    async getAvailability(providerIdPram: ProviderIdParamDto, dateQuery: AvailabilityDateDto,clientTimezone?: string): Promise<{ providerId: string; date: string; availableSlots: string[] }> {
        const { providerId } = providerIdPram;
        const { date } = dateQuery;
        const provider = await this.providerRepository.findOne({ where: { id: providerId } });
        if (!provider) throw new NotFoundException('Provider not found');

        const dayName = DateTime.fromISO(date).toFormat('cccc').toLowerCase();
        const schedule = provider.weeklySchedule[dayName];
        if (!schedule) {
            return { providerId, date, availableSlots: [] };
        }

        const startUTC = DateTime.fromISO(`${date}T${schedule.start}`, { zone: 'utc' });
        const endUTC = DateTime.fromISO(`${date}T${schedule.end}`, { zone: 'utc' });

        console.log(startUTC.toJSDate());
        console.log(endUTC.toJSDate());
        const appointments = await this.appointmentsService.getAppointmentByProviderIdWithDateInterval(
            providerId,
            startUTC.toJSDate(),
            endUTC.toJSDate(),
        );



        const bookedSlots = new Set<string>();
        appointments.forEach((appt) => {
            bookedSlots.add(DateTime.fromJSDate(appt.startTime).toISO());
        });

        const availableSlots: string[] = [];
        for (
            let dt = startUTC;
            dt < endUTC;
            dt = dt.plus({ minutes: provider.appointmentDuration })
        ) {
            const iso = dt.toISO();
            if (!bookedSlots.has(iso)) {
                const localTime = dt.setZone(clientTimezone ?? process.env.TZ);
                availableSlots.push(localTime.toFormat('HH:mm'));
            }
        }

        bookedSlots.forEach((slot) => {
            const localSlot = DateTime.fromISO(slot).setZone(clientTimezone ?? process.env.TZ).toFormat('HH:mm');
            const index = availableSlots.indexOf(localSlot);
            if (index !== -1) {
                availableSlots.splice(index, 1);
            }
        });

        return {
            providerId,
            date,
            availableSlots,
        };
    }


    async getProvider(providerId: string): Promise<Provider> {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
            relations: ['appointments'],
        });

        if (!provider) {
            throw new NotFoundException('Provider not found');
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
    return weekdays[day.toLowerCase()];
}
