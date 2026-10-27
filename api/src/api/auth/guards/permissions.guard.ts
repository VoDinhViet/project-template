import { HttpStatus, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '../../../constants/error-code.constant.js';
import type { Permission } from '../../../constants/permission.constant.js';
import { PERMISSIONS_KEY } from '../../../decorators/permissions.decorator.js';
import { AppException } from '../../../exceptions/app.exception.js';
import type { AuthenticatedRequest } from '../../../decorators/current-user.decorator.js';
import { readRouteAccess } from './route-access.js';

/**
 * Đóng theo mặc định: mọi route cần người dùng có vai trò, `@Permissions(...)` thêm mã quyền phải có.
 *
 * Rules:
 * - Chưa được mời (chưa có vai trò) → 403 `E025`; thiếu quyền → 403 `E006`.
 * - Chỉ chạy với route mức `ROLE` (xem `readRouteAccess`).
 * - Không đọc DB: quyền đã nạp mỗi request ở `AuthService.verifySession`, nên gỡ quyền có hiệu lực ngay.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (readRouteAccess(this.reflector, context) !== 'ROLE') {
      return true;
    }

    const { user: currentUser } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!currentUser) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    if (!currentUser.role) {
      throw new AppException(ErrorCode.E025, HttpStatus.FORBIDDEN);
    }
    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[] | undefined>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];
    if (
      !requiredPermissions.every((permission) =>
        currentUser.permissions.includes(permission),
      )
    ) {
      throw new AppException(ErrorCode.E006, HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
