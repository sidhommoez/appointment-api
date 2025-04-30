import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import pjson from '../package.json';

import { AppModule } from './app/app.module';
import { showStartupMessage } from './utils/start-message';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);
  const environment = configService.get('environment');
  const port = configService.get('port');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    credentials: true,
    origin: '*',
  });

  const config = new DocumentBuilder()
    .setTitle('Appointment API')
    .setDescription(
      `${pjson.version} - You need a UUID for a providerId. Generate one here: https://www.uuidgenerator.net/`,
    )
    .setVersion(pjson.version)
    .build();
  const doc = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/docs', app, doc, {
    swaggerOptions: {
      tryItOutEnabled: true,
    },
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.startAllMicroservices();

  await app.listen(port, '0.0.0.0', () => {
    showStartupMessage(pjson.name);
  });

  // this will exit the init container successfully after the start of the api without any errors
  if (configService.get('initContainer') && environment !== 'development') {
    console.info('Init container done');
    process.exit(0);
  }
}
bootstrap().then(() => console.info('Service Started'));
