import {
  Catch,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { ErrorDto } from '../common/dto/error.dto.js';
import type { AllConfigType } from '../config/config.type.js';
import { readRoutePattern } from '../common/utils/read-route-pattern.js';
import { toErrorDto } from './to-error-dto.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isDebug: boolean;

  constructor(configService: ConfigService<AllConfigType>) {
    // Ngoài production mới ghi log debug kèm stack; response thì không bao giờ chứa stack.
    this.isDebug =
      configService.getOrThrow('app.nodeEnv', { infer: true }) !== 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();
    const error = toErrorDto(exception);

    this.log(exception, error, request);
    response.status(error.statusCode).json(error);
  }

  private log(exception: unknown, error: ErrorDto, request: Request): void {
    const stack = exception instanceof Error ? exception.stack : undefined;

    if (error.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${readRoutePattern(request)} failed`,
        stack ?? String(exception),
      );
      return;
    }
    if (this.isDebug) {
      this.logger.debug({
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        message: error.message,
        details: error.details,
        stack,
      });
    }
  }
}
