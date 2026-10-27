---
paths:
  - "web/**"
---

# Frontend — cấu trúc, route, ranh giới

Bám theo `web-qlsx-start`. Đường dẫn tính từ `web/`. Import dùng alias **`@/`** (= `src/`); alias `#/` do CLI sinh nhưng không dùng.

## Layout `src/`

```
router.tsx               getRouter(): mỗi lần gọi tạo một QueryClient (không đặt ở module scope, tránh chia sẻ cache giữa request SSR) + SSR query integration
routeTree.gen.ts         SINH TỰ ĐỘNG — không sửa tay
styles.css               nguồn token (Tailwind v4 @theme)
routes/                  __root.tsx, index.tsx, (auth)/..., (authed)/...
features/<domain>/       lát cắt dọc theo nghiệp vụ
  api/server-functions/  *.api.ts — mỗi file một createServerFn
  api/options/           *.options.ts — mỗi file một queryOptions factory
  api/index.ts           barrel: chỉ factory và hook của chính feature, KHÔNG export server function
  components/{layouts,sections,composites,primitives}/
  hooks/  pages/  schemas/  constants/  utils/
components/ui/           shadcn sinh ra — không sửa tay
components/shared/{layouts,sections,composites,primitives}/
hooks/  lib/             hạ tầng dùng chung (utils.ts, zod-transforms.ts, error-messages.ts, ...)
lib/types/*.type.ts      kiểu domain + enum + bảng nhãn, một file mỗi domain
server/                  http.server.ts (instance axios `http`, gia hạn phiên, xoá cookie khi phiên hết hạn, `logHttpError`), env.server.ts, session.server.ts
```

- Feature chưa có màn hình thì chỉ có `api/` (feature "chỉ api").
- Chữ hiển thị tiếng Việt; tên, comment, tên file tiếng Anh/tiếng Việt theo `common/comments.md`.

## Ranh giới import (ESLint `no-restricted-imports` bắt buộc)

- `routes/**` **không** import `features/*/components/**` hay `features/*/api/server-functions/**`; route chỉ ghép `pages/*`, factory từ barrel `api/index.ts`.
- `lib/**` **không** import `features/**` (hạ tầng không biết nghiệp vụ).
- Feature A chỉ đọc feature B qua `features/B/api/index.ts`, không chạm file bên trong.
- `@/server/**` chỉ được import trong `features/*/api/server-functions/**` (và trong chính `src/server/**`).
- Mỗi khối `no-restricted-imports` thay thế hoàn toàn khối trước; sửa luật phải sửa trong `eslint.config.js` bằng các mảng pattern dùng chung, đừng thêm khối rời.
- Barrel `api/index.ts` chỉ export `queryOptions` factory và hook thuộc về feature đó, không bao giờ export server function thô.

## Route

- File route **mỏng**: chỉ `createFileRoute` với `validateSearch`, `beforeLoad`, `loader`, `pendingComponent`, `component` (là một Page trong `features/*/pages`). Logic không nằm trong route.
- Nhóm route: `(auth)` cho layout đăng nhập; `(authed)` cho khung có sidebar. **Guard đăng nhập duy nhất** nằm ở `beforeLoad` của `(authed)/route.tsx`; không viết kiểm tra auth song song ở nơi khác.
  `(authed)` đặt `headers: () => ({ 'Cache-Control': 'private, no-store' })`; lỗi dùng `defaultErrorComponent` (`RouteError`, nút "Thử lại" gọi `router.invalidate()`). Phiên hết hạn giữa chừng: `getRouter` bắt `SESSION_EXPIRED_MESSAGE` ở `QueryCache`/`MutationCache` rồi chạy lại guard.
- Phân quyền theo `currentUser.permissions` do `api` trả (admin có đủ mã; xem `backend/auth-security.md`):
  - Chỉ ẩn/hiện JSX: bọc `<PermissionGate permission="roles:create">` (`components/shared/composites/PermissionGate.tsx`).
  - Cần giá trị quyền trong logic: `const canInvite = useHasPermission('users:invite')` (`hooks/use-has-permission.ts`).
  - Ngoài component (route `beforeLoad`, vòng lặp): `hasPermission(currentUser, 'users:read')` (`lib/permission.ts`).
  - Trang cần quyền: `beforeLoad: ({ context }) => { if (!hasPermission(context.currentUser, 'users:read')) throw redirect({ to: '/forbidden' }) }`.
  - Mục sidebar cần quyền khai `permission` trong `menuGroups`; mục thiếu quyền bị ẩn.
  - Không xét `isSystem` khi kiểm quyền; chỉ dùng để hiển thị (nhãn "Hệ thống", gợi ý cho admin).
- Hậu tố `_` ở tên thư mục (`clients_/$clientId.update.tsx`) giữ URL lồng nhưng không kế thừa layout cha.
- Danh sách tách đôi: `clients/route.tsx` là layout (tiêu đề + `<Outlet/>`, không loader), `clients/index.tsx` sở hữu dữ liệu và `pendingComponent`.
- Search params (bộ lọc, phân trang) validate bằng Zod; **mọi param tuỳ chọn có `.catch()`**:
  ```ts
  page: z.number().int().min(1).catch(1),
  limit: z.union([z.literal(10), z.literal(20), z.literal(50)]).catch(10),
  q: z.string().trim().min(1).optional().catch(undefined),
  ```
- `from` của `useSearch/useNavigate` viết literal ngay tại chỗ (`useSearch({ from: '/(authed)/clients/' })`).
- Cấu hình router: `defaultPreload: 'intent'`, `defaultStaleTime: 0`, `defaultPreloadStaleTime: 0` (React Query quản lý độ tươi), `defaultStructuralSharing: true`, `context: { queryClient }`.

## Checklist

- [ ] Route mới mỏng, logic nằm ở `features/<domain>/pages`.
- [ ] Không import vượt ranh giới (ESLint sạch).
- [ ] Không sửa tay `routeTree.gen.ts`, `components/ui/`.
- [ ] Search params có `.catch()`.
