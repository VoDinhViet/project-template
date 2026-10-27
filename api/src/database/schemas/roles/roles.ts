import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  datetime,
  mysqlTable,
  primaryKey,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core';
import type { Permission } from '../../../constants/permission.constant.js';

/**
 * Vai trò do hệ thống tự định nghĩa; quyền của vai trò nằm ở `role_permissions`.
 *
 * Rules:
 * - Đúng một vai trò `isSystem` (admin, tạo lúc bootstrap): luôn đủ mọi quyền (không lưu dòng quyền),
 *   không sửa, không xoá, không trao, để hệ thống không bao giờ mất người cấp lại quyền.
 * - Tối đa một vai trò `isDefault`.
 */
export const roles = mysqlTable(
  'roles',
  {
    id: char('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }),
    isSystem: boolean('is_system').notNull().default(false),
    // MySQL không có partial unique index: chỉ vai trò hệ thống có giá trị, các dòng NULL không va nhau.
    systemFlag: boolean('system_flag').generatedAlwaysAs(
      sql`IF(is_system, TRUE, NULL)`,
      { mode: 'stored' },
    ),
    isDefault: boolean('is_default').notNull().default(false),
    // Cùng cách với `systemFlag`: unique trên cột này giữ tối đa một vai trò mặc định.
    defaultFlag: boolean('default_flag').generatedAlwaysAs(
      sql`IF(is_default, TRUE, NULL)`,
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
    unique('uq_roles_name').on(table.name),
    unique('uq_roles_system_flag').on(table.systemFlag),
    unique('uq_roles_default_flag').on(table.defaultFlag),
  ],
);

/**
 * Bảng nối được thay toàn bộ khi sửa vai trò và không ai tham chiếu từng dòng, nên dùng khoá chính
 * ghép.
 */
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    roleId: char('role_id', { length: 36 })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    // Mã quyền `resource:action`, danh mục nằm trong code (`constants/permission.constant.ts`).
    permission: varchar('permission', { length: 100 })
      .$type<Permission>()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permission] })],
);

export type RoleSelect = typeof roles.$inferSelect;
