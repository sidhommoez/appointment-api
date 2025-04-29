import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Provider} from "./entities/provider.entity";
import {ProvidersController} from "./providers.controller";
import {ProvidersService} from "./providers.service";
import {AppointmentModule} from "../appointment/appointment.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Provider]),
        AppointmentModule
    ],
    providers: [ProvidersService],
    controllers: [ProvidersController],
})
export class ProvidersModule {}
