# Đặt tên

Bổ sung cho `~/claude-kho/rules/naming.md` (rule global vẫn áp dụng). Chỉ áp dụng cho code mới hoặc code đang sửa; **không đổi tên biến cũ không liên quan** trong cùng thay đổi.

## Biến

- Đặt theo **thứ nó chứa**, không theo hình dạng. Cấm tên chung chung: `rows`, `row`, `data`, `result`, `res`, `list`, `entries`, `items` (trừ khi thật sự là hàng `items`), `tmp`, `r`, `x`.
- Kết quả query = số nhiều của entity: `requisitions`, `suppliers`. Tham số callback = số ít: `(supplier) => ...`.
- `Map` đặt `<giá trị>By<Khoá>`: `supplierById`, `sourcesByReceiptId`. `Set`/mảng id nói id của gì: `issueIds`.
- Biến nhận kết quả của hàm đặt **cùng danh từ với tên hàm**: `const role = await ensureRoleExists(...)`, `const invitedUser = await this.ensureInvitedUserExists(...)`, `const pendingInvitation = await this.ensurePendingInvitationExists(...)`. Tên hàm nói kiểm quyền (`ensureCanX`) thì không dùng nó để trả bản ghi khác; tách thành `ensureXExists` + `ensureCanX`.
- Tham số id nêu rõ entity: `receiptId`, `clientId`; không dùng `id` trần khi hàm xử lý nhiều loại entity.
- Hai lớp của cùng entity thì tên khác nhau; không dùng một tên cho hai tài liệu khác nhau trong cùng scope.
- Hằng số nguyên thuỷ hoặc bất biến cấp module: `SCREAMING_SNAKE_CASE` (`SESSION_MAX_AGE_SECONDS`, `MYSQL_ERRNO`). Map/đối tượng hằng dùng làm bảng tra cho UI (`databaseStatusLabels`): `camelCase`.
- Boolean đọc như một mệnh đề: `isPending`, `hasPermission`.
- Hàm danh sách phân trang ở service theo một khuôn: điều kiện `where` (dùng chung cho câu lấy dòng và câu đếm) đặt `filter`; dòng lấy được đặt `entities`, số đếm đặt `totalRecords` (`const [entities, totalRecords] = await Promise.all([...])`, như `be-quanlysanxuat`). Đếm bằng `db.$count(table, filter)`; `filter` cần cột của bảng join thì đếm bằng `select({ totalRecords: count() })` cùng join. `entities` là ngoại lệ có chủ đích của luật cấm tên chung chung, chỉ dùng trong khuôn này.

## File

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Backend (mọi file) | kebab-case + hậu tố theo vai trò | `clients.controller.ts`, `clients.service.ts`, `clients.query.ts`, `clients.module.ts` |
| DTO request | `<hành động>-<entity>.req.dto.ts` | `create-client.req.dto.ts`, `get-clients.req.dto.ts` |
| DTO response | `<entity>.res.dto.ts` | `client.res.dto.ts`, `page-client.res.dto.ts` |
| Config | `<tên>.config.ts` + `<tên>-config.type.ts` | `database.config.ts` |
| Frontend: component, page | PascalCase, đúng tên export | `ClientsPage.tsx`, `CreateClientForm.tsx` |
| Frontend: còn lại | kebab-case + hậu tố | `get-client.api.ts`, `client.options.ts`, `client.schema.ts`, `client.type.ts`, `use-route-pagination.ts`, `session.server.ts` |

Ngoại lệ backend: file hàm thuần dùng chung theo một việc, không thuộc vai trò nào ở trên, đặt tên theo việc
đó và không thêm tiền tố thư mục hay hậu tố `.util`: `roles/grant.ts`.

## Class và hàm

- DTO request: `CreateXReqDto`, `UpdateXReqDto`, `GetXsReqDto` (query danh sách, cũng dùng cho ô chọn), và DTO hành động như `RejectOrderReqDto`.
- DTO response: `XResDto` (chi tiết), `PageXResDto` (một dòng danh sách), `XRefResDto` (tham chiếu gọn, dựng bằng `PickType`). Không có DTO riêng cho dropdown (xem `backend/api-conventions.md`).
- Service: `getXs`, `getX`, `createX`, `updateX`, `deleteX`, hành động (`approveOrder`); hàm bảo vệ nội bộ `ensureXExists`, `ensureXNotInUse`, `validateCodeUniqueness`.
- Controller: tham số body/query tên `reqDto`; route param theo entity (`:clientId`), **không dùng `:id`**.
- **Tạo component mới (FE) thì đề xuất tên cho người dùng chọn** (2–4 phương án, phương án khuyên dùng
  đứng đầu) trước khi chốt tên file; gom nhiều component của cùng một lượt vào một câu hỏi. Đổi tên
  component sẵn có cũng hỏi như vậy.
- Component hiển thị nhiều phần tử đặt tên bằng **danh từ số nhiều** đúng chính tả tiếng Anh (`DueIssues`, `ProjectActivities`, `Statuses`), **không** thêm hậu tố `List`. Ngoại lệ: component do shadcn sinh (`TabsList`, `BreadcrumbList`).
- Server function (FE): `getX`, `getXs`, `createX`, `updateX`, `deleteX`; `queryOptions` đặt `<tên>QueryOptions`; hàm dịch lỗi `resolve<Thing>ErrorMessage`.
- Nhãn hiển thị: `<entity>StatusLabels: Record<Enum, string>`.
- Mã lỗi BE: `E###` (nghiệp vụ) / `V###` (validate), giá trị dạng `'client.error.not_found'`. Số đã bỏ không dùng lại.
- Tool MCP: tên camelCase **trùng tên method service/controller** của việc nó gọi (`getIssues`, `moveIssue`); file `<domain>.tools.ts`, class `<Domain>Tools`.
- Permission code: `resource:action`, số nhiều ở `resource` (`clients:read`, `orders:approve`).

## Đồng bộ tên giữa `api` và `web`

Cùng một khái niệm mang **cùng tên** ở hai repo, để đọc một bên là tìm được bên kia:

| `api` | `web` |
|---|---|
| Method controller/service `createRole`, `getPermissions` | Server function `createRole`, `getPermissions`; trang `CreateRolePage`, `UpdateRolePage` |
| `CreateRoleReqDto`, `UpdateRoleReqDto` | Schema `createRoleSchema`, `updateRoleSchema` (tạo và sửa tách riêng) |
| `RoleResDto`, `PageUserResDto` | Kiểu `Role`, `User`; mảng `PERMISSIONS` + kiểu `Permission` giống hệt `api` |
| Mã lỗi `role.error.name_exists` | Chuỗi y hệt trong `resolve<Thing>ErrorMessage` |
| Luật `ensureCanGrantRole` ở `roles/grant.ts` | Hàm mô phỏng `canGrantRole(currentUser, role)` ở `utils/grant.ts`, comment ghi "Khớp `ensureCanGrantRole` của `api`" |
| Luật `ensureCanTransitionIssueStatus` ở `issue-statuses/transition.ts` | `canTransitionIssueStatus(project, fromStatusId, toStatusId)` ở `utils/transition.ts` |
| `@CurrentUser() currentUser: CurrentUser` | `currentUser: CurrentUser` (route context của `(authed)`) |
| `@Permissions('users:invite')` trên route; `currentUser.permissions.includes(...)` trong service | `useHasPermission('users:invite')`, `<PermissionGate permission="...">`, `hasPermission(currentUser, ...)` ở `lib/permission.ts`, mục menu `permission: 'users:read'` |
| Route param `:roleId` | Field `roleId` trong schema |

- Hàm phía `web` mô phỏng luật của `api` (chỉ để ẩn/hiện nút) giữ phần tên sau `ensure` (`ensureCanX` → `canX`) và đặt trong file cùng tên.
- Không đặt tên ngữ cảnh khác cho cùng một việc (`user-permissions.ts` cho luật trao vai trò, `RoleFormDialog` gộp tạo và sửa).

## Checklist

- [ ] Không còn tên chung chung trong code vừa thêm.
- [ ] Tên file đúng vai trò và hậu tố.
- [ ] Route param và tham số id nêu rõ entity.
- [ ] Tên ở `web` khớp tên ở `api` cho cùng khái niệm (method, DTO/schema, mã lỗi, luật).
- [ ] Component mới hoặc đổi tên đã được người dùng chọn tên.
