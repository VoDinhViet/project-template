---
paths:
  - "api/src/database/**"
  - "api/drizzle/**"
  - "api/drizzle.config.ts"
  - "api/src/api/**/*.service.ts"
  - "api/src/api/**/*.query.ts"
  - "api/src/api/**/*.write.ts"
---

# Backend — Drizzle ORM + MySQL/MariaDB

Dự án tham khảo dùng Postgres; mục này đã đổi sang **MySQL/MariaDB** (shared hosting). **Không chép nguyên** các điểm đặc thù Postgres: `pgTable`, `pgEnum`, `.returning()`, `onConflictDoUpdate`/`onConflictDoNothing` (MySQL dùng `onDuplicateKeyUpdate`; "không làm gì" viết là `onDuplicateKeyUpdate({ set: { id: sql\`id\` } })`), partial index, `ILIKE`/`unaccent`, mã lỗi `23505`.

## Kết nối

- `DatabaseModule` (`@Global()`) cung cấp token `DRIZZLE`: pool `mysql2/promise` + `drizzle({ client, schema, mode: 'planetscale' })`, đóng pool khi shutdown.
- **`mode: 'planetscale'` là bắt buộc với MariaDB**: `mode: 'default'` sinh `LEFT JOIN LATERAL` cho relational API (`db.query.x.findMany({ with })`), MariaDB không hỗ trợ nên mọi truy vấn `with:` lỗi cú pháp. Chế độ này dùng subquery JSON, MySQL 8 cũng chạy được.
- **Giữ Drizzle 0.x (`drizzle-orm` 0.45, `drizzle-kit` 0.31), chưa lên v1.** Đánh giá 2026-10-23 với `1.0.0-rc.5`:
  v1 bỏ `mode`, RQB v2 luôn sinh `LEFT JOIN LATERAL` mà MariaDB báo lỗi cú pháp, nên `with:` hỏng. Chỉ nâng khi
  Drizzle có chế độ MariaDB (issue drizzle-team/drizzle-orm#2007).
- Cột `datetime` luôn ở UTC do Drizzle tự chuyển đổi; `timezone: 'Z'` của pool chỉ có tác dụng với `sql` thô và code ngoài Drizzle. Vì vậy cột thời gian đặt mặc định ở app (`$defaultFn(() => new Date())`), không dùng `NOW()` của MySQL.
- Inject: `constructor(@Inject(DRIZZLE) private readonly db: Database) {}`.
- Kiểu ở `database/database.type.ts`: `Database = MySql2Database<typeof schema>`; `DbTransaction` suy ra từ callback của `transaction` để không lẫn với `Database`.

## Schema

- File: `database/schemas/<domain>/<bảng-kebab>.ts`, re-export tất cả trong `schemas/index.ts`. Service import bảng/enum từ `'../../database/schemas'`.
- Bảng: `mysqlTable`, tên snake_case số nhiều; cột TypeScript camelCase ánh xạ tên snake_case (`clientGroupId: char('client_group_id', { length: 36 })`).
- **Khoá chính** UUID `char(36)` **sinh ở app**:
  ```ts
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  ```
  MySQL không có `.returning()` và không tự sinh uuid: tạo id trong code trước khi insert để dùng cho bản ghi con.
- Cột audit: `createdAt: datetime('created_at').notNull().$defaultFn(() => new Date())`, `updatedAt` thêm `.$onUpdate(() => new Date())`, `deletedAt: datetime('deleted_at')` (xoá mềm), `createdBy` (FK tới `users.id`, `onDelete: 'set null'`). Bảng con thay toàn bộ khi sửa thì không cần `updatedAt`.
- Kiểu: `varchar` luôn có độ dài; tiền/số lượng `decimal(..., { precision, scale, mode: 'number' })`; ngày giờ dùng `datetime` (tránh giới hạn năm 2038 của `timestamp`) và **lưu UTC**, hiển thị theo `Asia/Ho_Chi_Minh`; cột dạng mảng dùng `json` hoặc bảng nối.
- FK **luôn khai báo `onDelete`** (`restrict` mặc định, `cascade` cho bảng con, `set null` cho cột audit).
- Enum: TypeScript `enum` (giá trị UPPER_CASE, trùng tên) và `mysqlEnum('column', [...])` cùng file. Đổi giá trị enum phải kèm migration.
- Tên index: `idx_<bảng>_<cột>`, `uq_<bảng>_<cột>`, `chk_<bảng>_<mô tả>`.
- Quan hệ định nghĩa cùng file (`relations(...)`); export type hàng: `export type ClientSelect = typeof clients.$inferSelect;`.
- Collation `utf8mb4_unicode_ci` cho cả DB để tìm kiếm không phân biệt hoa thường/dấu.

## Xoá mềm và tính duy nhất

- Xoá mềm = `update(...).set({ deletedAt: new Date() })`; **mọi truy vấn đọc phải thêm `isNull(table.deletedAt)`**.
- Trước khi xoá, `ensureXNotInUse` kiểm các bảng tham chiếu — **không** lọc bản ghi đã xoá mềm của bảng tham chiếu.
- MySQL **không có partial unique index**. Mã do người dùng nhập mà phải tái sử dụng được sau khi xoá mềm: dùng cột `generated` (ví dụ `activeCode = IF(deleted_at IS NULL, code, NULL)`) rồi đặt unique trên cột đó. Mẫu đã dùng (`invitations`: mỗi email chỉ một lời mời đang chờ):
  ```ts
  activeEmail: varchar('active_email', { length: 255 }).generatedAlwaysAs(
    sql`IF(accepted_at IS NULL AND revoked_at IS NULL, email, NULL)`,
    { mode: 'stored' },
  ),
  // unique('uq_invitations_active_email').on(table.activeEmail)
  ```
  Biểu thức viết tên cột trần (không qua `${table.x}`), dùng `stored` cho chắc trên cả MariaDB và MySQL. Cột gốc
  của cột generated không được có khoá ngoại `cascade`/`set null` (giới hạn của MySQL). Cần "đúng một dòng có
  cờ" thì sinh cột từ cờ (`IF(is_system, TRUE, NULL)`) rồi unique cột đó, như `roles.system_flag`.
  Cột gốc kiểu `char` (id uuid) phải bọc `RTRIM(...)`: MariaDB từ chối CHAR trần trong biểu thức
  generated (`department_users.primary_user_id`).
  Không đưa thời gian hiện tại vào biểu thức (không xác định): lời mời quá hạn vẫn giữ `active_email`, nên
  mời lại sẽ gia hạn dòng cũ.
- Trùng khoá: kiểm trước bằng `validateXUniqueness` và ném **mã lỗi riêng của entity** (`role.error.name_exists`, 409); `GlobalExceptionFilter` vẫn đổi lỗi 1062 khi hai lần ghi chen nhau thành `E003`.

## Truy vấn

- **Relational API** (`db.query.x.findMany/findFirst({ with })`) chỉ cho quan hệ `many` (vd nhãn của issue). Quan hệ `one` (`with: { status: true }`, `author`, `actor`) **lỗi `Unknown column` trên MariaDB** dù đã `mode: 'planetscale'` (subquery tham chiếu cột ngoài trong bảng dẫn xuất): lấy bằng query builder `innerJoin`/`leftJoin` (bảng `users` join hai lần thì `alias`). Đã kiểm 2026-10-23 trên MariaDB 10.11.
- **Mỗi controller độc lập có truy vấn riêng**: hai method service phục vụ hai controller khác nhau (`GET /issues` và `GET /projects/:projectId/issues/:issueId`; `GET /issue-comments` và route bình luận của issue) tự viết `select`/join của mình, không gọi chung một hàm `select*`; lặp vài dòng còn hơn để đổi logic ở route này làm lệch route kia. Chỉ tách khi là một quy tắc có tên (`selectVisibleProjectIds`, `lockProject`). Xem `common/layering.md`.
- **Query builder** cho `count`, aggregate, kiểm tồn tại (`.select().from().where().limit(1)`) và mọi lệnh ghi.
- Lọc tuỳ chọn: `and(cond, value ? eq(col, value) : undefined)`. Danh sách + tổng: `Promise.all([list, count])`.
- Tìm kiếm: `like(col, \`%${q}%\`)` (collation lo phần không dấu). Escape ký tự `%` `_` trong `q`.
- Ghi nhiều bảng: `await this.db.transaction(async (tx) => {...})`; hàm dùng chung nhận `tx: DbTransaction`.
- Update rỗng làm Drizzle ném "No values to set" → kiểm `hasFields(reqDto)` và ném lỗi 400 trước.
- Đọc theo ghi trong transaction (kiểm trạng thái rồi đổi) phải khoá hàng: `select ... for update`; trạng thái không hợp lệ ném 409.
- Không nối chuỗi vào SQL; dùng tham số của Drizzle hoặc template `sql\`\``.

## Migration

1. Sửa schema, export trong `schemas/index.ts`.
2. **Người dùng** chạy `pnpm db:generate` rồi `pnpm db:migrate` (xem `common/project-overrides.md`). Claude chỉ báo lệnh cần chạy.
3. File SQL sinh vào `api/drizzle/`; không sửa tay file đã áp dụng.
   - **Đọc file SQL trước khi migrate**, nhất là khi đổi tên bảng/cột/index. drizzle-kit có thể sinh
     `DROP INDEX` trước `DROP FOREIGN KEY` (MariaDB từ chối vì khoá ngoại còn dùng index) và dựng lại
     khoá chính vô cớ. Khi đó viết lại bằng tay (`RENAME INDEX`, bỏ rồi tạo lại khoá ngoại), giữ nguyên
     snapshot, và chạy thử trên một database tạm trong container trước. Ví dụ: `drizzle/0003_*.sql`.
   - DDL của MySQL/MariaDB **không nằm trong transaction**: migration lỗi giữa chừng để lại các lệnh đã
     chạy mà `__drizzle_migrations` không ghi nhận. Phải hoàn lại bằng tay rồi mới migrate lại.
4. Không bao giờ chạy migrate/reset lên DB remote. Production do pipeline deploy tự áp khi push `main`
   (`dist/database/migrate.js`, dump DB trước); migration phải **tương thích ngược** (chỉ thêm bảng/cột, cột mới
   nullable hoặc có mặc định) vì rollback code không rollback DB. Đổi tên/xoá thì tách hai lần deploy.

## Checklist

- [ ] Bảng mới: id `char(36)` sinh ở app, cột audit, FK có `onDelete`, index đặt tên đúng, đã export trong `schemas/index.ts`.
- [ ] Truy vấn đọc có `isNull(deletedAt)` nếu bảng xoá mềm.
- [ ] Ghi nhiều bảng nằm trong transaction; update rỗng đã chặn.
- [ ] Không dùng cú pháp Postgres (`returning`, `ILIKE`, partial index).
- [ ] Đã báo người dùng lệnh `db:generate` / `db:migrate` cần chạy.
