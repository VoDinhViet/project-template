# api

Backend NestJS 12 (ESM) + Drizzle ORM (MySQL/MariaDB). Quy ước code: `../.claude/rules/backend/`.

## Chạy

```bash
cp docker/.env.example docker/.env   # đặt mật khẩu DB local (không dùng dấu nháy)
pnpm db:up                           # MariaDB 10.11 trong Docker, cổng 127.0.0.1:3306
cp .env.example .env.local           # chỉnh DATABASE_URL (khớp QLDA_PASSWORD), INTERNAL_API_KEY, FIREBASE_*
pnpm install
pnpm start:dev                       # http://localhost:4000, tài liệu: /api-docs
```

DB local chạy bằng Docker (`docker/docker-compose.yml`): tạo sẵn database `quan_ly_du_an`, user `qlda` (toàn quyền, cho app/migration)
và `qlda_ro` (chỉ `SELECT`, cho MySQL MCP). Script khởi tạo chỉ chạy khi volume còn trống; đổi mật khẩu sau đó thì `pnpm db:down` rồi
`docker volume rm qlda_mariadb_data` (xoá dữ liệu local) rồi `pnpm db:up` lại.

Đăng nhập bằng Google hoặc email/mật khẩu (Firebase): điền `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` lấy từ file service account (giữ `\n` chữ trong khoá, bọc nháy kép). Bảng `users` cần `pnpm db:generate` rồi `pnpm db:migrate`.

Email lời mời (Resend): đặt `RESEND_API_KEY` và `MAIL_FROM` (tên miền gửi phải được xác minh trên Resend; trên hosting đặt ở biến môi trường của Node.js App). Để trống cả hai thì tính năng tắt: `POST /api/invitations` với `shouldSendEmail: true` vẫn tạo lời mời và trả `emailStatus: DISABLED`, người mời gửi link tay.

`GET /api/health` công khai (không cần `X-Internal-Key`); mọi route khác yêu cầu header `X-Internal-Key`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | Kiểm tra chất lượng |
| `pnpm db:up` / `pnpm db:down` | Bật / tắt MariaDB local (Docker) |
| `pnpm db:generate` / `pnpm db:migrate` | Tạo / áp dụng migration (người dùng tự chạy, không chạy lên DB remote) |

## Triển khai cPanel (Node.js App)

Startup file là `app.cjs` (Passenger không chạy được ESM trực tiếp). Biến môi trường của app đặt trong cPanel.

**CI/CD**: push lên `main` chạy `.github/workflows/deploy.yml`: `typecheck`, `lint`, `format:check`, `build`, rồi gửi
artifact (`dist`, `drizzle`, `app.cjs`, `package.json`) qua SSH tới forced command `~/bin/qlda-deploy-api.sh` trên
hosting. Script đó dump DB và chạy `dist/database/migrate.js` khi có migration mới, đổi bản trong
`~/releases/qlda-api/`, restart, kiểm `/api/health` (phải có `"db":"UP"`), hỏng thì tự rollback; thành công thì CI
đánh tag `vX.Y.Z`. `node_modules` production (pnpm hoisted) chỉ gửi lên khi `pnpm-lock.yaml` đổi.

- Secret repo: `HOSTING_SSH_KEY` (key deploy, chỉ chạy được forced command), `HOSTING_KNOWN_HOSTS`. Biến repo:
  `HOSTING_HOST`, `HOSTING_PORT`, `HOSTING_USER`.
- Migration phải tương thích ngược (chỉ thêm): rollback code không rollback DB. Dump trước migrate ở
  `~/backups/production/`.
- Thao tác tay qua key deploy: `ssh <host> status|releases|rollback|restart|logs [N]`.
