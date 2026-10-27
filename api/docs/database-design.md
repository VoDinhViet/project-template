# Thiết kế cơ sở dữ liệu

Schema nằm ở `src/database/schemas/` (mỗi domain một thư mục, comment trong file giải thích các
ràng buộc); quy ước ở `../.claude/rules/backend/database.md`. Tài liệu này giữ lý do thiết kế.

Mỗi bản triển khai phục vụ **một đơn vị**, không có khái niệm tổ chức (`organizations`, `organization_id`).

## 1. Các nhóm bảng

| Nhóm                   | Bảng                                                | Điểm chính                                                                                              |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Người dùng, phân quyền | `users`, `roles`, `role_permissions`, `invitations` | mục 2                                                                                                   |
| Email                  | `email_outbox`                                      | hàng đợi gửi lại email lời mời khi Resend lỗi; nội dung mã hoá bằng `MAIL_OUTBOX_KEY`, cron gửi lại     |

## 2. Phân quyền động toàn hệ thống

```text
roles ──< role_permissions          (permission: mã trong code)
roles ──< users.role_id             (null = chưa được mời, không vào được)
roles ──< invitations.role_id
```

- Chỉ người được mời mới vào: đăng nhập chỉ tạo `users`; `role_id` `null` thì `PermissionsGuard`
  từ chối mọi route trừ `@NoRoleRequired()` (xem/chấp nhận lời mời, `GET /users/me`). Chấp nhận lời mời gán
  `role_id`; gỡ người dùng đặt lại `null` (mời lại được).
- **Không có vai trò cố định.** Chỉ có vai trò hệ thống ("Chủ sở hữu", `is_system`), tạo và gán cho
  email `BOOTSTRAP_OWNER_EMAIL` ở lần đăng nhập đầu khi chưa ai giữ nó; vai trò khác tự tạo qua `/roles`.
- Vai trò hệ thống là của **admin duy nhất**: đủ mọi quyền kể cả quyền thêm sau (không lưu dòng
  quyền), không sửa, không xoá; không trao qua mời/đổi vai trò, không tước hay gỡ
  (`ensureCanGrantRole`), nên luôn đúng một người giữ. Admin không hiện trong danh sách người dùng.
  Unique `system_flag` (cột generated `IF(is_system, TRUE, NULL)`) đảm bảo chỉ có một vai trò
  như vậy. Đổi admin không có API: xoá mềm dòng `users` của admin cũ trong DB, đặt `BOOTSTRAP_OWNER_EMAIL`
  là email mới, rồi đăng nhập bằng email đó.
- Chống leo quyền (`ensureCanGrantRole`): chỉ trao/tước vai trò có quyền nằm trong quyền của mình.
- Mã quyền không có bảng riêng vì gắn với route; bỏ một mã thì migration phải xoá các dòng mang mã đó.

## 3. Quy ước áp dụng cho mọi bảng mới

- id `char(36)` sinh ở app; `created_at`/`updated_at` đặt ở app (UTC); `deleted_at` cho bảng xoá mềm.
- Khoá ngoại luôn có `onDelete`; người dùng không xoá cứng nên FK tới `users` là `restrict` (bắt buộc) hoặc
  `set null` (audit/tuỳ chọn). Tên `idx_`/`uq_`/`chk_`/`fk_`; khoá ngoại ghép đặt tên tay (giới hạn 64 ký tự).
- Bảng nối người dùng đặt `<thực thể>_users`; **không dùng chữ `member`** trong tên bảng, cột, code.
- Cột chỉ ngày (`YYYY-MM-DD` giờ Việt Nam) dùng `date` mode `string`; thời điểm dùng `datetime` UTC.
- Enum dùng `mysqlEnum(tên, TsEnum)`, không dùng `VARCHAR` tự do.
- Migration bằng `drizzle-kit generate` + `migrate` (người dùng tự chạy), không `push` lên DB thật.
