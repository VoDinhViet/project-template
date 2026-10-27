import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ErrorCode } from '../../constants/error-code.constant.js';
import {
  PERMISSIONS,
  type Permission,
} from '../../constants/permission.constant.js';
import type { DbTransaction } from '../../database/database.type.js';
import { rolePermissions, roles } from '../../database/schemas/index.js';
import { AppException } from '../../exceptions/app.exception.js';
import type {
  CurrentUser,
  RoleRef,
} from '../../decorators/current-user.decorator.js';

export type RoleWithPermissions = RoleRef & {
  isDefault: boolean;
  permissions: readonly Permission[];
};

/**
 * Vai trò kèm quyền, đọc trong transaction.
 *
 * Rules:
 * - Luôn khoá (`for update`) vai trò và dòng quyền để sửa/xoá vai trò và trao/tước vai trò không
 *   chen nhau (người không có quyền Q trao vai trò vừa được thêm Q).
 * - Quyền cũng đọc bằng locking read: đọc thường lấy snapshot của transaction, có thể đã cũ.
 * - Vai trò `isSystem` trả mọi quyền dù không lưu dòng quyền.
 */
export async function ensureRoleExists(
  tx: DbTransaction,
  roleId: string,
): Promise<RoleWithPermissions> {
  const [role] = await tx
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1)
    .for('update');
  if (!role) {
    throw new AppException(ErrorCode.E021, HttpStatus.NOT_FOUND);
  }
  if (role.isSystem) {
    return { ...role, permissions: PERMISSIONS };
  }
  const grantedPermissions = await tx
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, role.id))
    .for('update');
  return {
    ...role,
    permissions: grantedPermissions.map(
      (grantedPermission) => grantedPermission.permission,
    ),
  };
}

/**
 * Chống leo quyền: chỉ được trao (mời, gán) hoặc tước (gỡ, đổi đi) vai trò có quyền nằm trong quyền
 * của mình. Trả vai trò đã khoá.
 *
 * Rules:
 * - Vai trò hệ thống là của admin duy nhất (gán qua `BOOTSTRAP_OWNER_EMAIL`): không ai trao hay tước
 *   được, kể cả admin, nên hệ thống luôn còn đúng một admin.
 * - Admin trao/tước được mọi vai trò khác.
 */
export async function ensureCanGrantRole(
  tx: DbTransaction,
  currentUser: CurrentUser,
  roleId: string,
): Promise<RoleWithPermissions> {
  const role = await ensureRoleExists(tx, roleId);
  if (role.isSystem) {
    throw new AppException(ErrorCode.E023, HttpStatus.CONFLICT);
  }
  ensureCanGrantPermissions(currentUser, role.permissions);
  return role;
}

/** Chỉ được cấp các quyền mình đang có; admin có đủ mọi mã nên cấp được mọi quyền. */
export function ensureCanGrantPermissions(
  currentUser: CurrentUser,
  permissions: readonly Permission[],
): void {
  if (
    !permissions.every((permission) =>
      currentUser.permissions.includes(permission),
    )
  ) {
    throw new AppException(ErrorCode.E006, HttpStatus.FORBIDDEN);
  }
}
