import {
  createParamDecorator,
  HttpStatus,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { ErrorCode } from '../constants/error-code.constant.js';
import type { Permission } from '../constants/permission.constant.js';
import type { RoleSelect } from '../database/schemas/index.js';
import { AppException } from '../exceptions/app.exception.js';

export type RoleRef = Pick<RoleSelect, 'id' | 'name' | 'isSystem'>;

/** Người dùng của request, do `FirebaseAuthGuard` dựng qua `AuthService.verifySession`. */
export type CurrentUser = {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  // `null` khi chưa được mời: không có quyền nào, chỉ gọi được route `@NoRoleRequired()`.
  role: RoleRef | null;
  // Admin nhận đủ `PERMISSIONS`, kể cả mã thêm sau, vì vai trò hệ thống không lưu dòng quyền.
  permissions: readonly Permission[];
};

export type AuthenticatedRequest = Request & { user?: CurrentUser };

// Chỉ dùng ở route đã qua `FirebaseAuthGuard`; ở route `@Public()` hay `@InternalOnly()` sẽ ném 401.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    return user;
  },
);
