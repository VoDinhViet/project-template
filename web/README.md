# web

Frontend TanStack Start (SSR) + shadcn/ui trên Base UI. Server functions chỉ làm BFF: gọi `api` (NestJS), không chứa nghiệp vụ.
Quy ước code: `../.claude/rules/frontend/`.

## Chạy

```bash
cp .env.example .env         # API_URL, INTERNAL_API_KEY (phải trùng với api), SESSION_SECRET (`openssl rand -hex 32`), VITE_FIREBASE_* (cấu hình web của Firebase); thiếu/sai biến thì server báo `Invalid environment variables` kèm tên biến (kiểm tra ở `src/server/env.server.ts`, `src/lib/env.ts`)
pnpm install
pnpm dev                     # http://localhost:3000 (cần api chạy ở API_URL)
```

## Lệnh

| Lệnh                                          | Việc                                                       |
| --------------------------------------------- | ---------------------------------------------------------- |
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | Kiểm tra chất lượng                                        |
| `pnpm dlx shadcn@latest add <component>`      | Thêm component shadcn (không sửa tay `src/components/ui/`) |

Gọi `api` bằng axios (`src/server/http.server.ts`) trong server function; đổi route/DTO ở `api` thì sửa tay kiểu/schema ở đây.

## Triển khai cPanel (Node.js App)

Startup file là `app.cjs` (Passenger không chạy được ESM trực tiếp). Đặt biến môi trường `API_URL`,
`INTERNAL_API_KEY`, `SESSION_SECRET` trong cPanel.

**CI/CD**: push lên `main` chạy `.github/workflows/deploy.yml`: `typecheck`, `lint`, `format:check`, `build`, rồi gửi
artifact (`.output`, `app.cjs`, `package.json`) qua SSH tới forced command `~/bin/qlda-deploy-web.sh` trên hosting:
đổi bản trong `~/releases/qlda-web/`, restart, kiểm `/login`, hỏng thì tự rollback; thành công thì CI đánh tag
`vX.Y.Z`. Đổi contract với `api` thì push `api` trước.

- Secret repo: `HOSTING_SSH_KEY`, `HOSTING_KNOWN_HOSTS`. Biến repo: `HOSTING_HOST`, `HOSTING_PORT`, `HOSTING_USER`
  và `VITE_FIREBASE_*` (cấu hình web Firebase công khai, Vite nhúng lúc build).
- Thao tác tay qua key deploy: `ssh <host> status|releases|rollback|restart|logs [N]`.
