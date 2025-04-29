import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Appointment} from "./entities/appointment.entity";
import {AppointmentsService} from "./appointment.service";
import {AppointmentsController} from "./appointment.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
    ],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
    exports: [AppointmentsService],
})
export class AppointmentModule {}
