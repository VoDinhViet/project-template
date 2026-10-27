import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { IS_INTERNAL_ONLY_KEY } from '../../../decorators/internal-only.decorator.js';
import { IS_NO_ROLE_REQUIRED_KEY } from '../../../decorators/no-role-required.decorator.js';
import { IS_PUBLIC_KEY } from '../../../decorators/public.decorator.js';

/**
 * Mức kiểm tra một route cần, từ lỏng tới chặt; mỗi guard toàn cục chỉ chạy khi route cần tới mức
 * của nó.
 *
 * Rules:
 * - `PUBLIC`: bỏ qua mọi guard xác thực.
 * - `INTERNAL_ONLY`: chỉ `InternalKeyGuard` (chưa có phiên: đổi ID token lấy session cookie, đọc email lời mời).
 * - `NO_ROLE`: cần phiên nhưng chưa cần vai trò (người chưa được mời).
 * - `ROLE`: mặc định, cần đủ ba guard.
 */
export type RouteAccess = 'PUBLIC' | 'INTERNAL_ONLY' | 'NO_ROLE' | 'ROLE';

export function readRouteAccess(
  reflector: Reflector,
  context: ExecutionContext,
): RouteAccess {
  const targets = [context.getHandler(), context.getClass()];
  const readFlag = (metadataKey: string): boolean =>
    reflector.getAllAndOverride<boolean | undefined>(metadataKey, targets) ===
    true;

  if (readFlag(IS_PUBLIC_KEY)) {
    return 'PUBLIC';
  }
  if (readFlag(IS_INTERNAL_ONLY_KEY)) {
    return 'INTERNAL_ONLY';
  }
  if (readFlag(IS_NO_ROLE_REQUIRED_KEY)) {
    return 'NO_ROLE';
  }
  return 'ROLE';
}
