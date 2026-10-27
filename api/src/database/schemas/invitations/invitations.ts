import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  index,
  mysqlTable,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core';
import { roles } from '../roles/roles.js';
import { users } from '../users/users.js';

export const invitations = mysqlTable(
  'invitations',
  {
    id: char('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    email: varchar('email', { length: 255 }).notNull(),
    // Xoá vai trò kéo theo lời mời đã dùng/thu hồi (chỉ là lịch sử); lời mời đang chờ thì service
    // chặn trước.
    roleId: char('role_id', { length: 36 })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    // Chỉ lưu SHA-256 của token: lộ DB không dùng được link mời.
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    invitedBy: char('invited_by', { length: 36 }).references(() => users.id, {
      onDelete: 'set null',
    }),
    expiresAt: datetime('expires_at').notNull(),
    acceptedAt: datetime('accepted_at'),
    acceptedBy: char('accepted_by', { length: 36 }).references(() => users.id, {
      onDelete: 'set null',
    }),
    revokedAt: datetime('revoked_at'),
    // MySQL không có partial unique index: cột này chỉ có giá trị khi lời mời còn chờ (xem
    // backend/database.md).
    activeEmail: varchar('active_email', { length: 255 }).generatedAlwaysAs(
      sql`IF(accepted_at IS NULL AND revoked_at IS NULL, email, NULL)`,
      { mode: 'stored' },
    ),
    createdAt: datetime('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime('updated_at')
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_invitations_token_hash').on(table.tokenHash),
    unique('uq_invitations_active_email').on(table.activeEmail),
    index('idx_invitations_role_id').on(table.roleId),
    index('idx_invitations_expires_at').on(table.expiresAt),
  ],
);

export type InvitationSelect = typeof invitations.$inferSelect;
