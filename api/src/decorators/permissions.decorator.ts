import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../constants/permission.constant.js';

export const PERMISSIONS_KEY = 'permissions';

/** Route cần đủ mọi quyền được liệt kê, tính theo vai trò người dùng đang giữ (xem `PermissionsGuard`). */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
