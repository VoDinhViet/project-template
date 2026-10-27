import { randomUUID } from 'node:crypto';
import {
  char,
  datetime,
  index,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core';
import { roles } from '../roles/roles.js';

export const users = mysqlTable(
  'users',
  {
    id: char('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    // Khoá liên kết với Firebase; không dùng làm khoá chính (xem backend/auth-security.md).
    firebaseUid: varchar('firebase_uid', { length: 128 })
      .notNull()
      .unique('uq_users_firebase_uid'),
    email: varchar('email', { length: 255 }).notNull().unique('uq_users_email'),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 1024 }),
    lastLoginAt: datetime('last_login_at').notNull(),
    // `null` = chưa được mời: đăng nhập được nhưng chỉ xem/chấp nhận lời mời (xem backend/auth-security.md).
    roleId: char('role_id', { length: 36 }).references(() => roles.id, {
      onDelete: 'restrict',
    }),
    // Phiên đăng nhập trước mốc này bị từ chối; kiểm trong DB để không gọi Google ở mỗi request.
    sessionsRevokedAt: datetime('sessions_revoked_at'),
    createdAt: datetime('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime('updated_at')
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    deletedAt: datetime('deleted_at'),
  },
  (table) => [index('idx_users_role_id').on(table.roleId)],
);

export type UserSelect = typeof users.$inferSelect;
