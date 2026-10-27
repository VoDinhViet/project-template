import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  isNull,
  ne,
} from 'drizzle-orm';
import { hasFields } from '../../common/utils/has-fields.js';
import { ErrorCode } from '../../constants/error-code.constant.js';
import {
  PERMISSIONS,
  permissionCatalog,
  type Permission,
} from '../../constants/permission.constant.js';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database, DbTransaction } from '../../database/database.type.js';
import {
  invitations,
  rolePermissions,
  roles,
  users,
} from '../../database/schemas/index.js';
import { AppException } from '../../exceptions/app.exception.js';
import type { CurrentUser } from '../../decorators/current-user.decorator.js';
import { CreateRoleReqDto } from './dto/create-role.req.dto.js';
import { PermissionResDto } from './dto/permission.res.dto.js';
import { RoleResDto } from './dto/role.res.dto.js';
import { UpdateRoleReqDto } from './dto/update-role.req.dto.js';
import { ensureCanGrantPermissions, ensureCanGrantRole } from './grant.js';

@Injectable()
export class RolesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  getPermissions(): PermissionResDto[] {
    return plainToInstance(
      PermissionResDto,
      PERMISSIONS.map((permission) => ({
        code: permission,
        ...permissionCatalog[permission],
      })),
      { excludeExtraneousValues: true },
    );
  }

  /** Số vai trò nhỏ nên trả cả danh sách, không phân trang. */
  async getRoles(): Promise<RoleResDto[]> {
    const rolesWithUserCount = await this.db
      .select({
        ...getTableColumns(roles),
        userCount: count(users.id),
      })
      .from(roles)
      // Không dùng subquery `sql`: select một bảng thì Drizzle bỏ tên bảng, `id` bị hiểu sai bảng.
      .leftJoin(users, and(eq(users.roleId, roles.id), isNull(users.deletedAt)))
      .groupBy(roles.id)
      .orderBy(desc(roles.isSystem), asc(roles.name));
    const grantedPermissions = await this.db.select().from(rolePermissions);
    const permissionsByRoleId = new Map<string, string[]>();
    for (const grantedPermission of grantedPermissions) {
      permissionsByRoleId.set(grantedPermission.roleId, [
        ...(permissionsByRoleId.get(grantedPermission.roleId) ?? []),
        grantedPermission.permission,
      ]);
    }

    return plainToInstance(
      RoleResDto,
      rolesWithUserCount.map((role) => ({
        ...role,
        permissions: role.isSystem
          ? PERMISSIONS
          : (permissionsByRoleId.get(role.id) ?? []),
      })),
      { excludeExtraneousValues: true },
    );
  }

  async createRole(
    currentUser: CurrentUser,
    reqDto: CreateRoleReqDto,
  ): Promise<void> {
    ensureCanGrantPermissions(currentUser, reqDto.permissions);
    const roleId = randomUUID();
    await this.db.transaction(async (tx) => {
      await this.validateRoleNameUniqueness(tx, reqDto.name);
      await tx.insert(roles).values({
        id: roleId,
        name: reqDto.name,
        description: reqDto.description,
      });
      await this.insertRolePermissions(tx, roleId, reqDto.permissions);
    });
  }

  /**
   * Sửa tên, mô tả hoặc thay toàn bộ quyền của vai trò.
   *
   * Rules:
   * - Phải trao được cả bộ quyền hiện tại lẫn bộ quyền mới, không tự nâng quyền qua việc sửa vai trò.
   * - Vai trò hệ thống cố định: `ensureCanGrantRole` trả `E023`, kể cả với admin, nên cũng không thành
   *   vai trò mặc định được.
   * - Đặt mặc định phải bỏ cờ vai trò cũ trước: unique `uq_roles_default_flag` kiểm sau từng lệnh. Bỏ
   *   cờ vai trò cũ không cần kiểm quyền trao vai trò đó vì không tước gì của ai.
   */
  async updateRole(
    roleId: string,
    currentUser: CurrentUser,
    reqDto: UpdateRoleReqDto,
  ): Promise<void> {
    if (!hasFields(reqDto)) {
      throw new AppException(ErrorCode.V002, HttpStatus.BAD_REQUEST);
    }
    await this.db.transaction(async (tx) => {
      const role = await ensureCanGrantRole(tx, currentUser, roleId);
      if (reqDto.permissions) {
        ensureCanGrantPermissions(currentUser, reqDto.permissions);
      }
      if (reqDto.name !== undefined) {
        await this.validateRoleNameUniqueness(tx, reqDto.name, role.id);
      }
      if (reqDto.permissions) {
        await tx
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));
        await this.insertRolePermissions(tx, role.id, reqDto.permissions);
      }
      if (reqDto.isDefault) {
        await tx
          .update(roles)
          .set({ isDefault: false })
          .where(and(eq(roles.isDefault, true), ne(roles.id, role.id)));
      }
      // Luôn đặt `updatedAt` để chỉ đổi quyền cũng không làm `.set()` rỗng.
      await tx
        .update(roles)
        .set({
          name: reqDto.name,
          description: reqDto.description,
          isDefault: reqDto.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, role.id));
    });
  }

  async deleteRole(roleId: string, currentUser: CurrentUser): Promise<void> {
    await this.db.transaction(async (tx) => {
      const role = await ensureCanGrantRole(tx, currentUser, roleId);
      // Vai trò mặc định phải được thay bằng vai trò khác trước khi xoá.
      if (role.isDefault) {
        throw new AppException(ErrorCode.E086, HttpStatus.CONFLICT);
      }
      await this.ensureRoleNotInUse(tx, role.id);
      await tx.delete(roles).where(eq(roles.id, role.id));
    });
  }

  /**
   * Lời mời đã dùng hay đã thu hồi chỉ là lịch sử, xoá theo vai trò (xem schema `invitations`).
   *
   * Rules:
   * - Đếm cả người đã xoá mềm: khoá ngoại `restrict` của `users.role_id` vẫn chặn xoá.
   */
  private async ensureRoleNotInUse(
    tx: DbTransaction,
    roleId: string,
  ): Promise<void> {
    const userCount = await tx.$count(users, eq(users.roleId, roleId));
    const pendingInvitationCount = await tx.$count(
      invitations,
      and(
        eq(invitations.roleId, roleId),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    );
    if (userCount > 0 || pendingInvitationCount > 0) {
      throw new AppException(ErrorCode.E022, HttpStatus.CONFLICT);
    }
  }

  /**
   * Báo đúng "trùng tên vai trò" (`E027`).
   *
   * Rules:
   * - Hai lần ghi chen nhau vẫn có thể lọt kiểm tra; khi đó unique `uq_roles_name` trả `E003`.
   */
  private async validateRoleNameUniqueness(
    tx: DbTransaction,
    name: string,
    roleId?: string,
  ): Promise<void> {
    const sameNameRoleCount = await tx.$count(
      roles,
      and(eq(roles.name, name), roleId ? ne(roles.id, roleId) : undefined),
    );
    if (sameNameRoleCount > 0) {
      throw new AppException(ErrorCode.E027, HttpStatus.CONFLICT);
    }
  }

  private async insertRolePermissions(
    tx: DbTransaction,
    roleId: string,
    permissions: readonly Permission[],
  ): Promise<void> {
    const uniquePermissions = [...new Set(permissions)];
    if (uniquePermissions.length === 0) {
      return;
    }
    await tx
      .insert(rolePermissions)
      .values(uniquePermissions.map((permission) => ({ roleId, permission })));
  }
}
