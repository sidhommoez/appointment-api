import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '../configuration';
import { HealthModule } from '../common/health/health.module';
import pgDataSource from '../pg-data-source';
import {ProvidersModule} from "../features/provider/providers.module";
import {AppointmentModule} from "../features/appointment/appointment.module";

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          ...pgDataSource.options,
        };
      },
    }),
    ProvidersModule,
    AppointmentModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
