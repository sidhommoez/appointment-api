import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

export class ErrorHelper {
  static throwNotFound(message: string): never {
    throw new NotFoundException(message);
  }

  static throwBadRequest(message: string): never {
    throw new BadRequestException(message);
  }

  static throwConflict(message: string): never {
    throw new ConflictException(message);
  }
}
