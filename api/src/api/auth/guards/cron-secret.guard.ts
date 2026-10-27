import { createHash, timingSafeEqual } from 'node:crypto';
import {
  HttpStatus,
  Injectable,
  Logger,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { readRoutePattern } from '../../../common/utils/read-route-pattern.js';
import type { AllConfigType } from '../../../config/config.type.js';
import { CRON_SECRET_HEADER } from '../../../constants/app.constant.js';
import { ErrorCode } from '../../../constants/error-code.constant.js';
import { AppException } from '../../../exceptions/app.exception.js';

const FAILURE_WINDOW_MS = 60 * 1000;
// Cron thật chỉ gọi mỗi 5 phút, nên vài lần sai mỗi phút đã là dò secret.
const MAX_FAILURES_PER_WINDOW = 10;
const REJECTED_WARN_INTERVAL_MS = 10 * 1000;

// So sánh băm để timingSafeEqual không bị lộ độ dài secret qua lỗi khác độ dài.
const digestOf = (value: string): Buffer =>
  createHash('sha256').update(value).digest();

/**
 * Bảo vệ route cron (`@Public()` nên các guard xác thực toàn cục bỏ qua) bằng secret riêng.
 *
 * Rules:
 * - Chưa cấu hình `CRON_SECRET` thì trả 404 như route không tồn tại, không để lộ route cron đang tắt.
 * - Giới hạn số lần sai trong bộ nhớ của process (toàn cục, không theo IP vì `request.ip` là của proxy):
 *   quá `MAX_FAILURES_PER_WINDOW` lần sai mỗi phút thì trả 429 trước cả khi so secret.
 * - Chỉ cron của cPanel biết secret; không đưa nó sang `web`.
 */
@Injectable()
export class CronSecretGuard implements CanActivate {
  private readonly logger = new Logger(CronSecretGuard.name);
  private failureWindowStartedAt = 0;
  private failureCount = 0;
  private lastRejectedWarnAt = 0;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedSecret = this.configService.get('cron.secret', {
      infer: true,
    });
    if (!expectedSecret) {
      throw new AppException(ErrorCode.E002, HttpStatus.NOT_FOUND);
    }

    const now = Date.now();
    if (now - this.failureWindowStartedAt >= FAILURE_WINDOW_MS) {
      this.failureWindowStartedAt = now;
      this.failureCount = 0;
    }
    if (this.failureCount >= MAX_FAILURES_PER_WINDOW) {
      throw new AppException(ErrorCode.E043, HttpStatus.TOO_MANY_REQUESTS);
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedSecret = request.header(CRON_SECRET_HEADER);
    if (
      !providedSecret ||
      !timingSafeEqual(digestOf(providedSecret), digestOf(expectedSecret))
    ) {
      this.failureCount += 1;
      // Không ghi secret đã gửi; chỉ cần dấu vết để phát hiện dò secret, tối đa một dòng mỗi 10 giây.
      if (now - this.lastRejectedWarnAt >= REJECTED_WARN_INTERVAL_MS) {
        this.lastRejectedWarnAt = now;
        this.logger.warn(
          `Rejected cron secret on ${request.method} ${readRoutePattern(request)} from ${request.ip}`,
        );
      }
      throw new AppException(ErrorCode.E088, HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}
