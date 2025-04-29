import { describe, it, expect } from 'vitest';
import { ErrorHelper } from './error.helper';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

describe('ErrorHelper', () => {
  it('should throw NotFoundException with the correct message', () => {
    const message = 'Resource not found';
    expect(() => ErrorHelper.throwNotFound(message)).toThrowError(
      new NotFoundException(message),
    );
  });

  it('should throw BadRequestException with the correct message', () => {
    const message = 'Invalid request';
    expect(() => ErrorHelper.throwBadRequest(message)).toThrowError(
      new BadRequestException(message),
    );
  });

  it('should throw ConflictException with the correct message', () => {
    const message = 'Conflict occurred';
    expect(() => ErrorHelper.throwConflict(message)).toThrowError(
      new ConflictException(message),
    );
  });
});
