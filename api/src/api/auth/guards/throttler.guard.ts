import { isIP } from 'node:net';
import { HttpStatus, Injectable, type ExecutionContext } from '@nestjs/common';
import { normalizeIp, ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../../../decorators/current-user.decorator.js';
import { CLIENT_IP_HEADER } from '../../../constants/app.constant.js';
import { ErrorCode } from '../../../constants/error-code.constant.js';
import { AppException } from '../../../exceptions/app.exception.js';
import { readRouteAccess } from './route-access.js';

// Cảnh báo thiếu `X-Client-IP` mỗi phút một lần để không làm ngập log khi cấu hình sai.
const MISSING_CLIENT_IP_WARN_INTERVAL_MS = 60 * 1000;

/**
 * IP của người dùng cuối, dùng làm khoá đếm.
 *
 * Rules:
 * - Chỉ BFF gọi `api` nên `request.ip` luôn là IP của `web`; IP trình duyệt do BFF chuyển qua
 *   `X-Client-IP`.
 * - Tin được header này vì `InternalKeyGuard` chạy trước và chỉ BFF biết khoá nội bộ. Route `@Public()`
 *   bỏ qua guard đó nên header có thể bị giả; giữ chúng nhẹ hoặc `@SkipThrottle()`.
 * - Giá trị không phải IP bị bỏ để không ai tạo được vô số khoá đếm; IPv6 gộp theo dải /64.
 */
export function readClientIp(request: AuthenticatedRequest): string {
  return normalizeIp(readForwardedIp(request) ?? request.ip ?? 'unknown');
}

function readForwardedIp(request: AuthenticatedRequest): string | undefined {
  const forwardedIp = request.header(CLIENT_IP_HEADER);
  return forwardedIp && isIP(forwardedIp) !== 0 ? forwardedIp : undefined;
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private lastMissingClientIpWarnAt = 0;

  override canActivate(context: ExecutionContext): Promise<boolean> {
    // Chỉ BFF mới chuyển `X-Client-IP`; route công khai không có header này.
    if (readRouteAccess(this.reflector, context) !== 'PUBLIC') {
      this.warnIfClientIpMissing(
        context.switchToHttp().getRequest<AuthenticatedRequest>(),
      );
    }
    return super.canActivate(context);
  }

  // `request.ip` luôn là IP của `web`; khoá đếm phải là IP người dùng cuối do BFF chuyển qua.
  protected override getTracker(
    request: AuthenticatedRequest,
  ): Promise<string> {
    return Promise.resolve(readClientIp(request));
  }

  protected override throwThrottlingException(): Promise<void> {
    throw new AppException(ErrorCode.E043, HttpStatus.TOO_MANY_REQUESTS);
  }

  // Không ghi giá trị header: thiếu hoặc sai nghĩa là mọi người dùng chung bộ đếm theo IP của `web`.
  private warnIfClientIpMissing(request: AuthenticatedRequest): void {
    const now = Date.now();
    if (
      readForwardedIp(request) !== undefined ||
      now - this.lastMissingClientIpWarnAt < MISSING_CLIENT_IP_WARN_INTERVAL_MS
    ) {
      return;
    }
    this.lastMissingClientIpWarnAt = now;
    this.logger.warn(
      `Thiếu hoặc sai ${CLIENT_IP_HEADER}: bộ đếm theo IP đang dùng IP của web`,
    );
  }
}
