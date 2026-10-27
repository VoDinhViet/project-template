import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  isNull,
  like,
  or,
} from 'drizzle-orm';
import { OffsetPaginatedDto } from '../../common/dto/offset-pagination/offset-pagination.dto.js';
import { escapeLike } from '../../common/utils/escape-like.js';
import { Order } from '../../constants/app.constant.js';
import { ErrorCode } from '../../constants/error-code.constant.js';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database, DbTransaction } from '../../database/database.type.js';
import { roles, users } from '../../database/schemas/index.js';
import { AppException } from '../../exceptions/app.exception.js';
import type { CurrentUser } from '../../decorators/current-user.decorator.js';
import { ensureCanGrantRole } from '../roles/grant.js';
import { GetUsersReqDto } from './dto/get-users.req.dto.js';
import { UpdateUserRoleReqDto } from './dto/update-user-role.req.dto.js';
import { PageUserResDto, UserResDto } from './dto/user.res.dto.js';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  getCurrentUser(currentUser: CurrentUser): UserResDto {
    return plainToInstance(UserResDto, currentUser, {
      excludeExtraneousValues: true,
    });
  }

  async getUsers(
    reqDto: GetUsersReqDto,
  ): Promise<OffsetPaginatedDto<PageUserResDto>> {
    const keyword = reqDto.q ? `%${escapeLike(reqDto.q)}%` : undefined;
    const filter = and(
      isNull(users.deletedAt),
      // Người giữ vai trò hệ thống (admin) luôn ẩn: không đổi, không gỡ được.
      eq(roles.isSystem, false),
      keyword
        ? or(like(users.displayName, keyword), like(users.email, keyword))
        : undefined,
      reqDto.roleId ? eq(users.roleId, reqDto.roleId) : undefined,
    );
    const sortOrder = reqDto.order === Order.DESC ? desc : asc;
    const [entities, [{ totalRecords }]] = await Promise.all([
      this.db
        .select({
          ...getTableColumns(users),
          role: getTableColumns(roles),
        })
        .from(users)
        .innerJoin(roles, eq(roles.id, users.roleId))
        .where(filter)
        // `id` làm khoá phụ để người trùng tên không lặp hay mất giữa các trang.
        .orderBy(sortOrder(users.displayName), sortOrder(users.id))
        .limit(reqDto.limit)
        .offset(reqDto.offset),
      this.db
        .select({ totalRecords: count() })
        .from(users)
        .innerJoin(roles, eq(roles.id, users.roleId))
        .where(filter),
    ]);

    return new OffsetPaginatedDto(
      plainToInstance(PageUserResDto, entities, {
        excludeExtraneousValues: true,
      }),
      totalRecords,
      reqDto.limit,
      reqDto.page,
    );
  }

  /** Đổi vai trò là tước vai trò cũ rồi trao vai trò mới, nên phải trao được cả hai. */
  async updateUserRole(
    userId: string,
    currentUser: CurrentUser,
    reqDto: UpdateUserRoleReqDto,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const invitedUser = await this.ensureInvitedUserExists(tx, userId);
      await ensureCanGrantRole(tx, currentUser, invitedUser.roleId);
      await ensureCanGrantRole(tx, currentUser, reqDto.roleId);
      await tx
        .update(users)
        .set({ roleId: reqDto.roleId })
        .where(eq(users.id, invitedUser.id));
    });
  }

  /** Gỡ quyền truy cập là tước vai trò (`ensureCanGrantRole`); giữ tài khoản để mời lại được. */
  async removeUser(userId: string, currentUser: CurrentUser): Promise<void> {
    await this.db.transaction(async (tx) => {
      const invitedUser = await this.ensureInvitedUserExists(tx, userId);
      await ensureCanGrantRole(tx, currentUser, invitedUser.roleId);
      await tx
        .update(users)
        .set({ roleId: null })
        .where(eq(users.id, invitedUser.id));
    });
  }

  /** Người đã được mời (có vai trò); khoá dòng để đổi/gỡ vai trò không chen nhau. */
  private async ensureInvitedUserExists(
    tx: DbTransaction,
    userId: string,
  ): Promise<{ id: string; roleId: string }> {
    const [invitedUser] = await tx
      .select({ id: users.id, roleId: users.roleId })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1)
      .for('update');
    if (!invitedUser?.roleId) {
      throw new AppException(ErrorCode.E002, HttpStatus.NOT_FOUND);
    }
    return { id: invitedUser.id, roleId: invitedUser.roleId };
  }
}
