---
paths:
  - "web/**"
---

# Frontend — type safety, bảo mật, phong cách code

## Type safety

- `strict` TypeScript. **Cấm** `any`, `@ts-ignore`, `@ts-expect-error` và toán tử non-null `!`. Dùng `unknown` rồi thu hẹp kiểu.
- Mỗi `as` phải có lý do ngắn bằng comment.
- `import type { ... }` cho kiểu; import named từ `react`, không `import * as React`.
- `type` là mặc định; `interface` chỉ cho hợp đồng công khai có thể mở rộng. Đặt tên rõ cho kiểu object/props (`type FooProps = {...}`) ngay phía trên chỗ dùng, không inline dài.
- Enum map qua `Record<Enum, X>` để thêm giá trị mới thì typecheck báo thiếu.
- Kiểu domain phản chiếu DTO của `api`, viết tay ở `features/<feature>/types/<entity>.type.ts`; đổi DTO bên `api` thì sửa tay kiểu ở đây.
- Hàm export có kiểu tham số và kiểu trả về tường minh.

## Bảo mật

- Token/phiên **chỉ nằm trong cookie httpOnly** (Secure ở production, SameSite=Lax). Không đưa vào `localStorage`, store hay HTML.
- **Biến môi trường chỉ đọc qua hai module đã kiểm tra bằng `@t3-oss/env-core` + Zod**: `serverEnv` (`@/server/env.server`) cho biến server, `clientEnv` (`@/lib/env`) cho `VITE_*`. Không đọc `process.env` / `import.meta.env` trực tiếp ở nơi khác. Thêm biến mới = thêm vào schema và `.env.example`.
- **Không đặt secret sau tiền tố `VITE_`.** Cấu hình web của Firebase là công khai nên được phép; service account và `INTERNAL_API_KEY` chỉ ở server (`*.server.ts` / biến môi trường server).
- File `*.server.ts` chỉ chạy phía server; không import chúng vào component.
- Mọi `redirectTo` sau đăng nhập phải qua `resolveInternalRedirect` (chống open redirect).
- Không log token, cookie hay response thô; log lỗi bằng `logHttpError(error, context)`.
- Đúng một guard đăng nhập (xem `frontend/structure.md`).
- Không dùng `dangerouslySetInnerHTML` với dữ liệu người dùng; nội dung rich-text phải được làm sạch trước.

## Phong cách

- **Giữ nguyên cấu hình Prettier/ESLint do CLI sinh** (`web/prettier.config.js`, `web/eslint.config.js`): không đổi kiểu dấu nháy, chấm phẩy hay quy tắc chung. Định dạng bằng `pnpm format`.
- Không thêm dependency khi chưa được duyệt. Không `eslint-disable` inline.
- Không `console.*` trong code phát hành; ngoại lệ duy nhất là `logHttpError` (`server/api-error.server.ts`).
- Kích thước: component > ~150 dòng hoặc hàm > ~40 dòng hoặc lồng > 3 tầng thì tách. Khi nào tách, khi nào viết inline: xem `common/layering.md`.
- Ưu tiên: lookup object thay `switch` dài, `Set.has` trong vòng lặp, `??`/`??=`, early return, `cond && <JSX/>` (với số đếm viết `count > 0 && ...` để không in ra `0`).
- Bất biến: không đột biến props/state; tạo bản sao khi cập nhật.
- Xoá code chết ngay trong cùng thay đổi.
- **Style viết inline tại phần tử**: class Tailwind nằm thẳng trong `className="..."` hoặc `cn('...', điều kiện && '...')`, `style={{ ... }}` cũng viết tại chỗ. Không tách ra hằng module (`MENU_BUTTON_CLASS`, `SIDEBAR_STYLE`) hay biến riêng, kể cả khi chuỗi dài. Ngoại lệ duy nhất: bảng tra `Record<Enum, string>` khi class đổi theo giá trị enum (`roleBadgeClasses`).
- Hằng số nguyên thuỷ cấp module `SCREAMING_SNAKE_CASE` (`REQUEST_TIMEOUT_MS`); map/đối tượng hằng `camelCase` (`databaseStatusLabels`) (xem `common/naming.md`).
- Component, `queryOptions` và `getRouter` được **bỏ kiểu trả về tường minh** (kiểu suy luận mang `DataTag`/`Register`); hàm còn lại giữ tường minh.
- Override ESLint đã duyệt (cấu hình trong `eslint.config.js`, đừng nới thêm): `import/no-cycle`, `import/order`, `sort-imports`, `array-type`, `require-await`, và khối `no-restricted-imports` ranh giới (xem `frontend/structure.md`).

## Checklist

- [ ] `pnpm typecheck` và `pnpm lint` sạch; không `any`/`!`/`@ts-ignore`.
- [ ] Biến env mới có trong schema `serverEnv`/`clientEnv` và `.env.example`; không secret ở `VITE_`; token chỉ trong cookie httpOnly.
- [ ] Không thêm dependency hay `eslint-disable` ngoài ý muốn.
- [ ] Không còn code chết, `console.log`.
- [ ] Class/style viết inline, không có hằng class tách ra ngoài.
