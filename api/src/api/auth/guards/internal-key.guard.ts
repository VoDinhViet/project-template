import { createHash, timingSafeEqual } from 'node:crypto';
import {
  HttpStatus,
  Injectable,
  Logger,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AllConfigType } from '../../../config/config.type.js';
import { INTERNAL_KEY_HEADER } from '../../../constants/app.constant.js';
import { readRoutePattern } from '../../../common/utils/read-route-pattern.js';
import { ErrorCode } from '../../../constants/error-code.constant.js';
import { AppException } from '../../../exceptions/app.exception.js';
import { readRouteAccess } from './route-access.js';

// So sánh băm để timingSafeEqual không bị lộ độ dài khoá qua lỗi khác độ dài.
const digestOf = (value: string): Buffer =>
  createHash('sha256').update(value).digest();

/** Chỉ BFF (`web`) biết khoá nội bộ, nên chỉ `web` gọi được API. */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly logger = new Logger(InternalKeyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (readRouteAccess(this.reflector, context) === 'PUBLIC') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header(INTERNAL_KEY_HEADER);
    const expectedKey = this.configService.getOrThrow('auth.internalApiKey', {
      infer: true,
    });

    if (
      !providedKey ||
      !timingSafeEqual(digestOf(providedKey), digestOf(expectedKey))
    ) {
      // Không ghi khoá đã gửi; chỉ cần dấu vết để phát hiện dò khoá.
      this.logger.warn(
        `Rejected internal key on ${request.method} ${readRoutePattern(request)} from ${request.ip}`,
      );
      throw new AppException(ErrorCode.E005, HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}
