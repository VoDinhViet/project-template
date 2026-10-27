---
paths:
  - "web/src/server/**"
  - "web/src/features/*/api/**"
  - "web/src/features/*/hooks/**"
  - "web/src/routes/**"
  - "web/src/lib/**"
---

# Frontend — server function, query, mutation

## Server function = ranh giới tin cậy (BFF)

`features/<domain>/api/server-functions/*.api.ts` — một `createServerFn` mỗi thao tác. Chỉ đọc cookie, gọi `api`, trả dữ liệu; **không** chứa nghiệp vụ hay truy cập DB.

```ts
import axios from 'axios'
import { GENERIC_ERROR_MESSAGE } from '@/lib/error-messages'
import { http, logHttpError } from '@/server/http.server'
import type { ApiErrorResponse } from '@/server/http.server'

function resolveCreateClientErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return GENERIC_ERROR_MESSAGE
  switch (error.response?.data.errorCode) {
    case 'client.error.code_exists': return 'Mã khách hàng đã tồn tại.'
    default: return GENERIC_ERROR_MESSAGE
  }
}

export const createClient = createServerFn({ method: 'POST' })
  .validator(createClientSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      await http.post('/api/clients', data)
    } catch (error) {
      logHttpError(error, 'createClient')
      throw new Error(resolveCreateClientErrorMessage(error))
    }
  })
```

- Phương thức validate là **`.validator()`** (bản đã cài `@tanstack/react-start` 1.169.3). Nếu nâng cấp mà đổi tên, cập nhật rule này.
- Luôn khai báo kiểu trả về; trả dữ liệu thuần, không bọc thêm `{ ok, data }`.
- Đọc dùng `GET`, ghi dùng `POST` (kể cả sửa/xoá — handler mới gọi `PATCH`/`DELETE` tới `api`).
- Lỗi: bắt lỗi axios (`axios.isAxiosError<ApiErrorResponse>`), ánh xạ `error.response?.data.errorCode` → thông báo tiếng Việt qua `resolve<Thing>ErrorMessage`, ném `Error` thường. Không có `error.response` nghĩa là không kết nối được tới `api` (mất mạng, hết thời gian chờ). **Không để chữ gốc của backend lọt ra UI.**
- Mọi lời gọi `api` đi qua **một instance axios `http`** ở `server/http.server.ts` (`API_URL`, `X-Internal-Key`, timeout 10 giây; request interceptor gắn `Authorization: Bearer` khi có cookie `qlda_session`; response interceptor xoá cookie khi `api` báo `auth.error.unauthenticated`/`account_disabled`). Hàm `resolve<Thing>ErrorMessage` của mọi feature phải trả `SESSION_EXPIRED_MESSAGE` cho hai mã đó, để `getRouter` đưa người dùng về trang đăng nhập. Server function gọi thẳng `http.get<T>('/api/...')`, `http.post<T>(...)` rồi lấy `response.data`. **Không viết client HTTP thứ hai**, không `fetch` tự viết.
- **Không sinh code từ OpenAPI.** Kiểu phản hồi viết tay ở `features/<feature>/types/<entity>.type.ts` (phản chiếu DTO của `api`), schema Zod của input ở `features/<feature>/schemas/`. Đổi DTO ở `api` thì sửa tay các kiểu/schema tương ứng ở `web` và kiểm tra thủ công; mã lỗi viết dưới dạng chuỗi trong `resolve<Thing>ErrorMessage`.
- `logHttpError` (cũng ở `http.server.ts`) là nơi duy nhất ghi log lỗi và được dùng `console.*`; không ghi token hay response thô.
- Đọc session/profile phải `setResponseHeader('Cache-Control', 'no-store')` để không lộ dữ liệu người dùng trước sau khi đổi tài khoản.
- Upload file: server function xin `api` URL ký, trình duyệt gửi file thẳng tới `api` (xem kế hoạch).

## Query

- `queryOptions` đặt trong `api/options/*.options.ts`, mỗi file một factory, tên `<thing>QueryOptions`, `queryFn` gọi thẳng server function (không `useServerFn`). **Không đặt `select` trong factory.**
  ```ts
  export const clientsQueryOptions = (search: ClientsSearch) =>
    queryOptions({ queryKey: ['clients', 'list', search], queryFn: () => getClients({ data: search }) })
  ```
- Khoá: `[feature, 'list', search]`, `[feature, 'detail', id]`; ô chọn dùng chung factory danh sách nên chung khoá `'list'`. Viết mảng literal trong từng file, không có file khoá chung.
- Độ tươi mặc định: `staleTime` 30s, `gcTime` 15 phút, `retry: 1`, `refetchOnWindowFocus: false`. Danh mục ít đổi: 5–15 phút. Màn hình cần "gần realtime": `staleTime: 0` + `refetchInterval` (polling; hosting không có WebSocket ổn định).
- **Loader chỉ prefetch, không trả dữ liệu, không bắt lỗi**, bằng API mới `queryClient.query`:
  ```ts
  loader: async ({ context, params }) => {
    await context.queryClient.query({ ...clientQueryOptions(params.clientId), staleTime: 'static' })
  },
  ```
  **Cấm** `ensureQueryData`, `prefetchQuery`, `fetchQuery` (đã lỗi thời trong dự án này). Dữ liệu mà HTML SSR hiển thị phải **chờ** (`await Promise.all([...].catch(() => undefined))`, chạy song song): nếu để `void` thì client nhận dữ liệu ngay lúc hydrate còn HTML SSR chưa có, gây lệch HTML. Chờ trong loader cũng cho `defaultPreload: 'intent'` làm nóng cache khi rê chuột vào link. Mỗi trang nên tải trước đủ truy vấn của mọi section để trình duyệt không phải gửi request sau hydrate: độ trễ ~1 giây của hosting rơi vào từng request từ trình duyệt, còn lời gọi `web` → `api` nội bộ thì không. Không đặt `loaderDeps` theo bộ lọc mà `keepPreviousData` đã xử lý mượt (đổi ngày, tìm kiếm), vì loader được chờ sẽ làm trang chớp.
- Trang chi tiết: `useSuspenseQuery(xQueryOptions(id))` ở tầng Page rồi truyền xuống bằng props. Trang danh sách: `useQuery({ ...xsQueryOptions(search), placeholderData: keepPreviousData })`, không dùng `loaderDeps` (lọc không làm trắng màn hình). Đọc tương tác (combobox debounce, `enabled: open`): `useQuery` trên factory.

## Mutation

```ts
const createClientFn = useServerFn(createClient)
const { mutate: create, isPending } = useMutation({
  mutationFn: (value: CreateClientSchema) => createClientFn({ data: value }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] })
    await navigate({ to: '/clients' })
  },
  onError: (error) => toast.error(error.message),
})
```

- Viết **destructure** `const { mutate: createDepartment, isPending } = useMutation({ ... })`, không giữ cả đối tượng `xMutation` rồi gọi `xMutation.mutate(...)`/`xMutation.isPending`. Tên `mutate` dùng đúng động từ của `api` (`create`/`update`/`delete`, hoặc tên hành động như `setDepartmentHead`), **không** dùng `add`/`save`/`remove` để web và `api` đồng bộ tên. Vì trùng tên server function nên nhập server function với hậu tố `Api`: `import { createDepartment as createDepartmentApi } from '.../create-department.api'` rồi `useServerFn(createDepartmentApi)`. Cần hai mutation trong một component thì đổi tên `isPending` (`isPending: isCreating`). Hook trả cả mutation cho nhiều nơi gọi (`useMoveIssue`) là ngoại lệ. Áp dụng cho code mới hoặc đang sửa, không đổi tên mutation cũ không liên quan.
- Mutation chỉ dùng ở **một** component thì viết `useMutation` ngay trong component đó (như `CreateRolePage`), không tách hook `use-*.ts`. Chỉ tách hook khi dùng ở nhiều nơi hoặc gói hành vi có tên dùng chung (`useRefreshUserAccess`). Xem `common/layering.md`.
- Hàm dịch lỗi chỉ ánh xạ mã lỗi **riêng của entity** sang thông báo nói tới entity đó; mã chung (`common.error.*`) dịch thành câu chung, không đoán ngữ cảnh.
- `invalidateQueries` theo key của **mọi** feature đọc dữ liệu vừa ghi (ghi phiếu kho → invalidate cả danh sách phiếu, tồn kho, báo cáo).
- **Không** `router.invalidate()` sau khi ghi entity. Ngoại lệ: đăng nhập/đăng xuất gọi `queryClient.clear()` → `router.invalidate()` → điều hướng.
- Lỗi hiện bằng toast `sonner` (`toast.error(error.message)`), không dùng Alert nội tuyến.

## Checklist

- [ ] Server function có `.validator()`, kiểu trả về, `try/catch` với hàm dịch lỗi tiếng Việt (ngoại lệ có chủ đích: `signOut` chỉ xoá cookie, không gọi `api`; `getCurrentUser` trả `null` khi `api` báo `auth.error.unauthenticated`/`account_disabled`, cookie đã được interceptor xoá).
- [ ] Chỉ gọi `api` qua `http` ở `server/http.server.ts`; không có axios/fetch tự viết nơi khác; kiểu phản hồi và schema input viết tay đúng chỗ.
- [ ] Loader dùng `queryClient.query(... staleTime: 'static')`, không `ensureQueryData`.
- [ ] Mutation invalidate đủ key các feature liên quan; lỗi qua toast.
- [ ] Không export server function qua barrel.

## Phiên đăng nhập

- Cookie `qlda_session` (httpOnly, `SameSite=Lax`, `Secure` khi `NODE_ENV=production`, nên phải đặt biến này trên cPanel) được **iron-session** mã hoá và ký bằng `SESSION_SECRET` (≥ 32 ký tự); bên trong là session cookie của Firebase, hạn của nó và refresh token Firebase; hạn trượt 30 ngày (`ttl` ghi lại mỗi lần gia hạn). Request interceptor của `http` gia hạn khi session cookie còn dưới 1 ngày (`POST /api/auth/session/refresh` qua `refreshClient` không interceptor, gộp các lượt song song theo refresh token). Chỉ đọc/ghi qua `server/session.server.ts` (các hàm `async`); không bao giờ đọc ở code trình duyệt. Đổi `SESSION_SECRET` là đăng xuất mọi người.
- Đăng nhập: trình duyệt `signInWithPopup(Google)` hoặc `signInWithEmailAndPassword` (`lib/firebase.ts`, nạp động, `inMemoryPersistence` và `signOut` Firebase ngay sau khi lấy ID token và refresh token) → server function `createSession` đổi ID token lấy cookie và cất refresh token. Đăng xuất: server function `signOut` chỉ xoá cookie; `signOutAllDevices` gọi `POST /api/auth/logout-all` rồi xoá cookie. Đăng xuất gọi `queryClient.clear()` → `router.invalidate()`; đăng nhập gọi `queryClient.clear()` → `navigate` (guard tự chạy lại).
- Guard đăng nhập duy nhất ở `beforeLoad` của `routes/(authed)/route.tsx` qua `currentUserQueryOptions()`; `getCurrentUser` trả `null` (và xoá cookie) khi 401/403.
- `redirect` sau đăng nhập phải qua `resolveInternalRedirect` (`lib/`).
