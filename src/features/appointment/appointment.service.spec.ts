import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Repository, DataSource } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { ProvidersService } from '../provider/providers.service';
vi.mock('../provider/providers.service', () => ({
  ProvidersService: vi.fn().mockImplementation(() => ({
    getProvider: vi.fn(),
    getAvailability: vi.fn(),
  })),
}));
import { AppointmentsService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentIdParamDto } from './dto/appointment-id-param.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepository: Repository<Appointment>;
  let providersService: ProvidersService;
  let connection: DataSource;

  beforeEach(() => {
    providersService = {
      getProvider: vi.fn(),
      getAvailability: vi.fn(),
    } as unknown as ProvidersService;

    appointmentRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
    } as unknown as Repository<Appointment>;

    connection = {
      transaction: vi.fn(),
    } as unknown as DataSource;

    service = new AppointmentsService(
      providersService,
      appointmentRepository,
      connection,
    );
  });

  describe('rescheduleAppointment', () => {
    it('should throw an error if the appointment is not found', async () => {
      const appointmentId = 'appt_123';
      const updateDto: UpdateAppointmentDto = {
        startTime: '2025-05-18T10:00:00Z',
      };

      appointmentRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.rescheduleAppointment(appointmentId, updateDto),
      ).rejects.toThrowError('Appointment not found or not confirmed');
    });

    it('should handle missing endTime gracefully', async () => {
      const appointmentId = 'appt_123';
      const updateDto: UpdateAppointmentDto = {
        startTime: '2025-05-18T10:00:00Z',
      };

      appointmentRepository.findOne = vi.fn().mockResolvedValue({
        id: appointmentId,
        providerId: 'prov_123',
        patientId: 'pat_456',
        startTime: new Date('2025-05-17T09:00:00Z'),
        endTime: null,
        status: 'CONFIRMED',
      });

      await expect(
        service.rescheduleAppointment(appointmentId, updateDto),
      ).rejects.toThrow();
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel an appointment successfully', async () => {
      const params: AppointmentIdParamDto = { appointmentId: 'appt_123' };

      appointmentRepository.findOne = vi.fn().mockResolvedValue({
        id: 'appt_123',
        status: 'CONFIRMED',
      });

      appointmentRepository.save = vi.fn().mockResolvedValue({
        id: 'appt_123',
        status: 'CANCELLED',
      });

      const result = await service.cancelAppointment(params);

      expect(result).toEqual({ message: 'Appointment cancelled successfully' });
    });

    it('should throw an error if appointment is not found', async () => {
      const params: AppointmentIdParamDto = { appointmentId: 'appt_123' };

      appointmentRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(service.cancelAppointment(params)).rejects.toThrowError(
        'Appointment not found or already cancelled',
      );
    });
  });

  describe('createAppointment - edge cases', () => {
    it('should throw if start time does not align with provider duration', async () => {
      const createDto: CreateAppointmentDto = {
        providerId: 'prov_123',
        patientId: 'pat_456',
        startTime: '2025-05-17T09:07:00Z',
      };

      (providersService.getProvider as Mock).mockResolvedValue({
        appointmentDuration: 15,
      });

      await expect(service.createAppointment(createDto)).rejects.toThrowError(
        'Start time must align with 15-minute intervals',
      );
    });
  });

  describe('getAppointmentByProviderIdWithDateInterval', () => {
    it('should return appointments in date range', async () => {
      const mockAppointments = [
        {
          id: 'appt_1',
          providerId: 'prov_1',
          status: 'CONFIRMED',
          startTime: new Date('2025-05-17T09:00:00Z'),
        },
      ];

      appointmentRepository.find = vi.fn().mockResolvedValue(mockAppointments);

      const result = await service.getAppointmentByProviderIdWithDateInterval(
        'prov_1',
        new Date('2025-05-17T00:00:00Z'),
        new Date('2025-05-17T23:59:59Z'),
      );

      expect(result).toEqual(mockAppointments);
    });
  });
});
