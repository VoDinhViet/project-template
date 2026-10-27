# 2610-quan-ly-du-an — Hệ thống quản lý dự án/task kiểu Jira

Nền tảng quản lý dự án/task. Mỗi bản triển khai là **một đơn vị** (một CLB hoặc một doanh nghiệp), không có
khái niệm tổ chức: chỉ người được mời mới vào được, quyền theo vai trò động toàn hệ thống.
Kế hoạch tổng thể: `~/.claude/plans/modal-opusplan-refactored-globe.md`.

## Cấu trúc

Hai project **độc lập** (mỗi project một git repo, không monorepo), nằm trực tiếp trong thư mục này:

| Thư mục | Vai trò | Công nghệ |
|---|---|---|
| `api/` | Backend. **Nơi duy nhất** chứa business logic, phân quyền, truy cập DB | NestJS 12 (ESM), Drizzle ORM + mysql2, class-validator, Swagger |
| `web/` | Frontend. Server functions chỉ làm **BFF** (đọc cookie, gọi `api`, trả dữ liệu) | TanStack Start 1.x (SSR), TanStack Query/Form, shadcn/ui trên Base UI, Tailwind v4 |

```
Trình duyệt ─► web (TanStack Start, SSR + server functions) ─► api (NestJS) ─► MySQL/MariaDB
                   cookie phiên httpOnly                  X-Internal-Key + session cookie
```

- Contract: DTO ở `api` (Swagger `/api-docs` ở môi trường dev). `web` gọi `api` bằng axios trong server function và **viết tay** kiểu/schema theo DTO (không sinh code từ OpenAPI); đổi DTO ở `api` thì sửa tay phía `web`.
- Xác thực: Firebase Authentication, đăng nhập bằng **Google** hoặc **email/mật khẩu** (tài khoản mật khẩu tạo qua link lời mời, bắt buộc xác minh email; email xác minh và đặt lại mật khẩu do Firebase gửi), session cookie qua BFF. Project dev: xem `.firebaserc`. Biến môi trường: `api` cần `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` và `FIREBASE_API_KEY` (web API key, để gia hạn phiên bằng refresh token); `web` cần `SESSION_SECRET` (khoá mã hoá cookie phiên, iron-session) và `VITE_FIREBASE_*` (xem `.env.example` của từng project). Email: Resend. Triển khai: shared hosting cPanel (Node.js App / Passenger) + MySQL/MariaDB; **push `main` là deploy** (GitHub Actions, repo private `VoDinhViet/smart-things-tasks-{api,web}`, xem `common/git-workflow.md` và README từng project).
- Giao diện dùng chung một bộ tên gọi và mẫu dự án cho mọi đơn vị (CLB hay doanh nghiệp), không có cấu hình loại đơn vị.
- Realtime bằng polling, job nền bằng cPanel Cron — hosting không có WebSocket ổn định, Redis hay queue.

## Lệnh thường dùng

Chạy trong từng project (`cd api` hoặc `cd web`), Node 24, pnpm 11:

| Việc | `api` | `web` |
|---|---|---|
| Chạy dev | `pnpm start:dev` (cổng 4000) | `pnpm dev` (cổng 3010) |
| Kiểm tra kiểu | `pnpm typecheck` | `pnpm typecheck` |
| Lint | `pnpm lint` | `pnpm lint` |
| Build | `pnpm build` | `pnpm build` |
| DB local (Docker) | `pnpm db:up` / `pnpm db:down` | — |
| Migration | `pnpm db:generate` / `pnpm db:migrate` (**do người dùng chạy**) | — |

## Rule

Rule nằm ở `.claude/rules/`, chia 3 thư mục: `common/` (áp dụng toàn dự án), `backend/` (chỉ `api/**`), `frontend/` (chỉ `web/**`).
Rule backend/frontend gắn `paths:` nên chỉ được nạp khi sửa đúng khu vực.

| Rule | Phạm vi |
|---|---|
| `common/project-overrides.md` | Toàn bộ — **thắng mọi rule khác** (commit, kiểm tra, quy trình) |
| `common/pause-test.md` | Toàn bộ — tạm dừng viết test |
| `common/git-workflow.md` | Toàn bộ — một nhánh `main`, commit, tag deploy |
| `common/naming.md` | Toàn bộ — đặt tên biến, file, DTO, method |
| `common/layering.md` | Toàn bộ — khi nào tách hàm/hook/component, khi nào viết inline |
| `common/comments.md` | Toàn bộ — chỉ comment "tại sao", tiếng Việt |
| `common/mcp.md` | Toàn bộ — MCP nào dùng cho việc gì, an toàn secret/DB |
| `backend/structure.md` | `api/**` — layout module, config, phân lớp |
| `backend/api-conventions.md` | `api/**` — route, DTO, lỗi, phân trang, Swagger |
| `backend/database.md` | `api/**` — Drizzle/MySQL, schema, truy vấn, migration |
| `backend/auth-security.md` | `api/**` — guard, quyền, bảo mật, log |
| `frontend/structure.md` | `web/**` — layout feature, route, ranh giới import |
| `frontend/data-layer.md` | `web/**` — server function, query, mutation |
| `frontend/forms-ui.md` | `web/**` — TanStack Form, shadcn/Base UI, UI tiếng Việt |
| `frontend/code-style.md` | `web/**` — type safety, bảo mật, phong cách code |

## MCP

`.mcp.json` (project, không secret): `shadcn` (tra component, vẫn cài bằng CLI) và `context7` (tài liệu thư viện).
`firebase` (`core,auth`, project dev `smart-things-tasks`; không nằm trong allowlist nên luôn hỏi). `mysql` (chỉ đọc, trỏ DB Docker local, user `qlda_ro`) do người dùng đăng ký ở cấp local. Chi tiết và quy tắc an toàn: `common/mcp.md`.
DB local: `cd api && pnpm db:up` (Docker, xem `api/README.md`).
MCP của chính sản phẩm (cho AI thao tác dữ liệu): `POST /api/mcp` ở `api`, xác thực bằng token cá nhân tạo ở trang "Kết nối MCP" của `web`; bật bằng `API_TOKENS_ENABLED=true`. Xem `backend/auth-security.md` và `common/mcp.md`.

## ECC

Plugin `ecc@ecc` (2.2.3) cài ở **scope project** bằng `claude plugin install ecc@ecc --scope project`; `enabledPlugins` nằm trong `.claude/settings.json`.
Không dùng `npx ecc-universal setup` vì nó từ chối khi `ecc@ecc` đã có ở nhiều dự án khác (scope mơ hồ), và không cài thêm theo cách thứ hai (tránh trùng skill/hook).
`.claude/settings.local.json` (máy này, không commit) đặt `ECC_HOOK_PROFILE=minimal` để hook ECC không chạy trùng `format-on-edit`/`typecheck-on-stop`, và tắt các skill ECC không liên quan stack (`skillOverrides`, lấy từ `be-quanlysanxuat`, bật lại frontend/MySQL, tắt Postgres/Redis).
Rule của ECC (`common`, `typescript`) đã nạp toàn cục qua `~/.claude/rules/kho`, nên **không chép vào dự án**. Agent gọi với tiền tố `ecc:` (`ecc:code-reviewer`, `ecc:security-reviewer`...).

## Ngôn ngữ

- Trả lời người dùng bằng **tiếng Việt**.
- Code, tên biến, commit, tên file: **tiếng Anh**. Comment: **tiếng Việt** (xem `common/comments.md`). Chữ hiển thị trên giao diện: **tiếng Việt**.

## Quy ước tham khảo

Cấu trúc code bám theo hai dự án `/home/workspace/2605-quanlysanxuat/be-quanlysanxuat` và `web-qlsx-start`,
đã điều chỉnh cho MySQL, Firebase và cPanel. Khi rule và code mâu thuẫn, **code là sự thật** — sửa lại rule cho đúng.
