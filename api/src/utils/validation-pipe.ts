import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    // Giữ nguyên mảng ValidationError để GlobalExceptionFilter dựng `details`.
    exceptionFactory: (validationErrors) =>
      new UnprocessableEntityException(validationErrors),
  });
}
