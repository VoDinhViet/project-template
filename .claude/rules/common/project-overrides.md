# Project overrides

Rule này **thắng mọi rule khác**, kể cả rule global trong `~/claude-kho/rules`.

## Git

- **Không `git commit` / `git push` khi chưa được yêu cầu rõ ràng.** Đồng ý một lần không áp dụng cho lần sau.
- Mỗi project (`api/`, `web/`) là một git repo riêng; commit ở đúng repo.
- Luồng nhánh, message, tag và deploy: `common/git-workflow.md`.

## Kiểm tra trước khi báo xong

Chạy trong project vừa sửa. Không báo hoàn thành khi chưa pass:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm format:check`
4. `pnpm build` khi đổi cấu hình build, route hoặc DTO công khai.
5. Đổi DTO/route ở `api` → sửa tay kiểu/schema tương ứng ở `web`, rồi `pnpm typecheck` + `pnpm lint` ở `web`.

Không có test tự động (xem `common/pause-test.md`): kiểm tra thủ công qua `/api-docs` và trình duyệt, nói rõ đã kiểm gì.

## Cơ sở dữ liệu

- **Không bao giờ** chạy `db:migrate`, `db:reset` hay script phá dữ liệu lên DB remote/production.
  Ngoại lệ có chủ đích (người dùng chọn 2026-10-24): migration production **chỉ** do pipeline deploy chạy, sau khi
  dump DB (xem `common/git-workflow.md`); Claude vẫn không tự migrate production.
- `drizzle-kit generate` có bước hỏi tương tác: **người dùng tự chạy**. Claude chỉ sửa schema rồi báo lệnh cần chạy.

## Quy trình sửa lỗi

1. Tái hiện lỗi ở môi trường local.
2. Tìm nguyên nhân gốc (đối chiếu payload mạng với màn hình trước khi đoán).
3. Sửa nhỏ nhất có thể, không dọn dẹp lan man.
4. Kiểm chứng lại và báo rõ kết quả.

## Sau mỗi đơn vị code

- Chạy `code-simplifier` và `ecc:code-reviewer` (song song). Thêm `ecc:security-reviewer` khi đụng xác thực, phân quyền, input người dùng, truy vấn DB, file hoặc API ngoài.
- Sửa CRITICAL/HIGH; liệt kê phần còn lại.

## Hỏi người dùng trước khi

- Thêm dependency mới.
- Đổi hợp đồng API hoặc hành vi nhìn thấy được.
- Làm điều không thể hoàn tác (xoá dữ liệu, ghi đè).
- Chọn giữa các hướng có đánh đổi thật sự. Còn lại: chọn mặc định hợp quy ước và nói rõ đã chọn gì.
