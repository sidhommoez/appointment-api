import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status =
        exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
        exception instanceof HttpException
            ? exception.getResponse()
            : { message: (exception as Error).message };
    // Log based on status code
    if (status >= 400 && status < 500) {
      this.logger.warn(
          `HTTP ${status} Warning: ${JSON.stringify(message)} - Path: ${request.url}`,
      );
    } else if (status >= 500) {
      this.logger.error(
          `HTTP ${status} Error: ${JSON.stringify(message)} - Path: ${request.url}`,
          exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'object' ? message : { message }),
    });
  }
}
