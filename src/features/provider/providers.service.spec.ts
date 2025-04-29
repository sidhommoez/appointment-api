import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppointmentsService } from '../appointment/appointment.service';
vi.mock('../appointment/appointment.service', () => ({
  AppointmentsService: vi.fn().mockImplementation(() => ({
    getAppointmentByProviderIdWithDateInterval: vi.fn(),
  })),
}));
import { ProvidersService } from './providers.service';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { AvailabilityDateDto } from './dto/get-availability-date.dto';
import { DateTime } from 'luxon';

vi.mock('../../common/helpers/error.helper', () => ({
  ErrorHelper: {
    throwBadRequest: vi.fn(() => {
      throw new Error('Bad Request');
    }),
    throwNotFound: vi.fn(() => {
      throw new Error('Not Found');
    }),
  },
}));

const mockProviderRepo = {
  create: vi.fn(),
  save: vi.fn(),
  findOne: vi.fn(),
};

const mockAppointmentsService = {
  getAppointmentByProviderIdWithDateInterval: vi.fn(),
};

describe('ProvidersService', () => {
  let service: ProvidersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProvidersService(
      mockAppointmentsService as unknown as AppointmentsService,
      mockProviderRepo as unknown as Repository<Provider>,
    );
  });

  describe('upsertSchedule', () => {
    it('should throw if schedule or timezone is missing', async () => {
      await expect(
        service.upsertSchedule({ providerId: '1' }, {} as CreateScheduleDto),
      ).rejects.toThrow('Bad Request');
    });

    it('should throw if a day is missing start/end', async () => {
      const dto = {
        timezone: 'UTC',
        weeklySchedule: { monday: { start: '', end: '15:00' } },
        appointmentDuration: 30,
      };
      await expect(
        service.upsertSchedule({ providerId: '1' }, dto),
      ).rejects.toThrow('Bad Request');
    });

    it('should create and save provider schedule', async () => {
      const dto: CreateScheduleDto = {
        timezone: 'UTC',
        appointmentDuration: 30,
        weeklySchedule: { monday: { start: '09:00', end: '17:00' } },
      };
      mockProviderRepo.create.mockReturnValue({ id: '1', ...dto });
      mockProviderRepo.save.mockResolvedValue({});

      const res = await service.upsertSchedule({ providerId: '1' }, dto);
      expect(res).toEqual({ message: 'Schedule created/updated successfully' });
    });
  });

  describe('getAvailability', () => {
    it('should throw if date is missing', async () => {
      await expect(
        service.getAvailability({ providerId: '1' }, {} as AvailabilityDateDto),
      ).rejects.toThrow('Bad Request');
    });

    it('should throw if provider not found', async () => {
      mockProviderRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getAvailability({ providerId: '1' }, { date: '2024-06-01' }),
      ).rejects.toThrow('Not Found');
    });

    it('should return empty array if no schedule for day', async () => {
      mockProviderRepo.findOne.mockResolvedValue({
        weeklySchedule: {},
      });

      const result = await service.getAvailability(
        { providerId: '1' },
        { date: '2024-06-01' },
      );

      expect(result.availableSlots).toEqual([]);
    });

    it('should return available slots', async () => {
      const provider = {
        id: '1',
        weeklySchedule: {
          saturday: { start: '09:00', end: '10:00' },
        },
        appointmentDuration: 30,
        timezone: 'UTC',
      };

      mockProviderRepo.findOne.mockResolvedValue(provider);
      mockAppointmentsService.getAppointmentByProviderIdWithDateInterval.mockResolvedValue(
        [],
      );

      const result = await service.getAvailability(
        { providerId: '1' },
        { date: '2024-06-01' },
        'UTC',
      );

      expect(result.availableSlots.length).toBe(2);
      expect(result.providerId).toBe('1');
      expect(result.date).toBe('2024-06-01');
    });

    it('should exclude booked slots', async () => {
      const provider = {
        id: '1',
        weeklySchedule: {
          saturday: { start: '09:00', end: '10:00' },
        },
        appointmentDuration: 30,
        timezone: 'UTC',
      };

      const booked = [
        {
          startTime: DateTime.fromISO('2024-06-01T09:00:00Z').toJSDate(),
        },
      ];

      mockProviderRepo.findOne.mockResolvedValue(provider);
      mockAppointmentsService.getAppointmentByProviderIdWithDateInterval.mockResolvedValue(
        booked,
      );

      const result = await service.getAvailability(
        { providerId: '1' },
        { date: '2024-06-01' },
        'UTC',
      );

      expect(result.availableSlots.length).toBe(1);
    });
  });

  describe('getProvider', () => {
    it('should return provider if found', async () => {
      const provider = { id: '1' };
      mockProviderRepo.findOne.mockResolvedValue(provider);

      const result = await service.getProvider('1');
      expect(result).toBe(provider);
    });

    it('should throw if provider not found', async () => {
      mockProviderRepo.findOne.mockResolvedValue(null);
      await expect(service.getProvider('1')).rejects.toThrow('Not Found');
    });
  });
});
