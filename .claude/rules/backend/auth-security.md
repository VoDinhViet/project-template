---
paths:
  - "api/**"
---

# Backend — xác thực, phân quyền, bảo mật

## Guard toàn cục (đăng ký bằng `APP_GUARD`, thứ tự quan trọng)

1. `InternalKeyGuard` — yêu cầu header `X-Internal-Key` khớp `INTERNAL_API_KEY` (so sánh hằng thời gian). Chỉ BFF (`web`) biết khoá nên chỉ `web` gọi được API.
1a. `ApiTokenGuard` — chỉ chạy với route `@ApiTokenAuth()` (hiện chỉ `/api/mcp`, xem mục "Token cá nhân (PAT) và MCP"); các route khác bỏ qua.
2. `FirebaseAuthGuard` — chỉ đọc `Authorization: Bearer <session cookie>` do BFF chuyển sang rồi gọi `AuthService.verifySession` (giống `JwtAuthGuard` → `verifyAccessToken` của `be-quanlysanxuat`). Service đó `verifySessionCookie(cookie, checkRevoked=false)` (không gọi mạng tới Google mỗi request), tải user nội bộ theo `firebase_uid` cùng vai trò và dòng quyền trong **một** truy vấn rồi gắn `CurrentUser` (kèm `permissions`; admin nhận đủ `PERMISSIONS`) vào request. Đọc DB mỗi request nên đổi/gỡ vai trò có hiệu lực ngay. Thiếu/hỏng phiên hoặc `auth_time` trước `users.sessions_revoked_at` → `E008` (401); user đã xoá mềm → `E009` (403).
   - Đăng xuất một thiết bị: BFF chỉ xoá cookie. Đăng xuất mọi thiết bị: `POST /auth/logout-all` đặt `sessions_revoked_at` rồi gọi `revokeRefreshTokens` (2026-10-24 đảo quyết định "không dùng `revokeRefreshTokens`": BFF nay cất refresh token để gia hạn phiên, phải thu hồi ở Firebase để không thiết bị nào gia hạn được).
   - `POST /auth/session` chỉ nhận ID token có `auth_time` trong 5 phút gần nhất (khuyến nghị của Firebase).
   - Gia hạn phiên: session cookie sống `SESSION_MAX_AGE_MS` (5 ngày). BFF cất refresh token Firebase (trình duyệt gửi kèm lúc đăng nhập) và khi session cookie còn dưới 1 ngày thì gọi `POST /auth/session/refresh` (`@InternalOnly()`, đếm bộ `ip` như `/auth/session`). `api` đổi refresh token qua Secure Token API (`FIREBASE_API_KEY`, web API key không giới hạn referrer), `verifyIdToken(checkRevoked=true)`, kiểm lại provider/email, `users` còn, chưa xoá mềm, `auth_time` gốc sau `sessions_revoked_at`, rồi cấp session cookie mới và trả refresh token Firebase trả về (có thể là token mới). Route này cố ý không kiểm 5 phút vì ID token làm mới giữ `auth_time` gốc. Cookie BFF có hạn trượt 30 ngày.
   - Vì không gọi Firebase mỗi request, khoá hay xoá tài khoản trên Firebase Console **không** chặn phiên đang có: phải xoá mềm (`deletedAt`) hoặc đặt `sessions_revoked_at` trong DB.
3. `PermissionsGuard` — **đóng theo mặc định**, không truy vấn DB: chỉ kiểm `user.permissions` đã nạp ở bước 2. Chưa có vai trò (chưa được mời) → 403 `E025`; thiếu một mã trong `@Permissions(...)` → 403 `E006`.
4. `ProjectAccessGuard` — chỉ cho route có `@ProjectRoles(...)` (xem mục Phân quyền).

- Mặc định **mọi route cần xác thực**. Route công khai đánh dấu `@Public()` / `@ApiPublic()` (health, file có URL ký, cron có secret riêng): bỏ qua mọi guard xác thực.
- Guard nào chạy cho route nào quyết định ở một chỗ: `readRouteAccess` (`api/auth/guards/route-access.ts`) trả `PUBLIC` / `INTERNAL_ONLY` / `API_TOKEN` / `NO_ROLE` / `ROLE`; guard không tự đọc metadata decorator.
- `@InternalOnly()` chỉ bỏ qua guard phiên, vẫn cần `X-Internal-Key`: dùng cho `POST /auth/session` (đổi Firebase ID token lấy session cookie) và `POST /auth/session/refresh`.
- Chỉ đăng nhập bằng **Google** (`google.com`) hoặc **email/mật khẩu** (`password`): từ chối `sign_in_provider` khác (`E011`) và tài khoản không có `email` hoặc `email_verified` (`E010`). Tài khoản mật khẩu chưa bấm link xác minh nên bị `E010`; mật khẩu do Firebase kiểm ở trình duyệt, `api` chỉ nhận ID token. `GET /invitations/:token/email` là route `@InternalOnly()` (cần `X-Internal-Key`, không cần phiên) để trang đăng ký biết email lời mời. Chỉ các mã lỗi Firebase liên quan tới token mới thành 401 (`E008`); mã khác (thiếu quyền IAM, quota...) ra 500 và được log.
- **Yêu cầu cấu hình Firebase** khi bật email/mật khẩu: Authentication → Settings → User account linking giữ "Link accounts that use the same email" (một tài khoản mỗi email), để tài khoản mật khẩu chưa xác minh của kẻ khác không sống sót khi chủ email đăng nhập bằng Google (chống pre-hijacking). `api` đã chặn ở lớp mình: tài khoản chưa `email_verified` bị `E010` trước khi tạo `users`, và lời mời chỉ nhận khi email trong token đã xác minh khớp lời mời. Lần đầu một tài khoản đăng nhập bằng Google (chưa có dòng `users`), `createSession` gỡ provider `password` còn gắn trên Firebase (`FirebaseService.unlinkPasswordProvider`) vì mật khẩu đó có thể do kẻ khác cài sẵn; người tự tạo mật khẩu rồi lần đầu dùng Google cũng mất mật khẩu, dùng "Quên mật khẩu" để tạo lại.
- Route không có `@Permissions` vẫn cần người dùng **có vai trò** (ví dụ `GET /users`). `GET /users` cố ý không cần `users:read`: mọi người có vai trò phải chọn được người để giao việc, nên ai có vai trò cũng đọc được email và vai trò của người khác. `users:read` chỉ ẩn/hiện trang quản lý ở `web`. Cùng lý do cho `GET /departments*` và `GET /job-titles` (ô chọn người, phòng ban, chức danh dùng khắp nơi): ai có vai trò cũng đọc được tên, email và phòng ban của mọi người; ghi thì cần `departments:*` / `job_titles:*`. Route người chưa được mời phải gọi được đánh dấu `@NoRoleRequired()` và chỉ trả dữ liệu của chính người đó: `GET /users/me`, `POST /auth/logout-all`, `GET /invitations/:token`, `POST /invitations/:token/accept`.
- Admin đầu tiên: email trong `BOOTSTRAP_OWNER_EMAIL` được gán vai trò hệ thống ở lần đăng nhập đầu, chỉ khi chưa ai giữ vai trò đó (`AuthService.syncFromFirebaseProfile`).
- `@CurrentUser()` trả `CurrentUser` (user nội bộ ánh xạ từ `firebase_uid`, `role`, `permissions`); tham số đặt `currentUser: CurrentUser`, cùng tên với `web`. Kiểu và decorator cùng tên, khai trong `decorators/current-user.decorator.ts`, nên một dòng import đủ cả hai. **Không** dùng uid Firebase làm khoá chính trong DB.

## Phân quyền

- **Phân quyền động toàn hệ thống**: vai trò là dữ liệu (`roles`), quyền của vai trò ở `role_permissions`, mỗi người dùng giữ tối đa một vai trò (`users.role_id`, `null` = chưa được mời). Không có vai trò cố định trong code ngoài vai trò hệ thống (`isSystem`, admin). Xem `api/docs/database-design.md` mục 2.1.
- Permission code `resource:action`, tách theo từng thao tác CRUD, **không dùng `manage`** (`roles:read`, `roles:create`, `roles:update`, `roles:delete`; thao tác trên mọi bản ghi thêm hậu tố `_all`: `projects:read_all`, `projects:update_all`), khai trong mảng `PERMISSIONS` (`as const`, kiểu `Permission` suy từ mảng, không dùng `enum`), danh mục kèm nhãn tiếng Việt ở `constants/permission.constant.ts` (`permissionCatalog`). Validate DTO bằng `EnumField(() => PERMISSIONS, { enumName: 'Permission' })`. Thêm mã mới thì vai trò hệ thống tự có; bỏ mã thì phải kèm migration xoá dòng quyền mang mã đó.
- **Kiểm quyền bằng decorator** `@Permissions('users:invite')` trên route (chuỗi mã có kiểu `Permission`, sai mã thì typecheck báo). Luật phụ thuộc đối tượng trong service viết thẳng `currentUser.permissions.includes('projects:read_all')`, không bọc hàm. Không xét `isSystem` khi kiểm quyền: admin đã được nạp đủ mọi mã. Không còn luật riêng nào của admin trong `api`.
  - Một mã không tự kéo theo mã khác. Luật nghiệp vụ cần "A hoặc B" viết thẳng tại chỗ (`projects:update_all` cũng thấy mọi dự án, xem `ProjectAccessGuard`).
  - Thêm mã quyền: mảng `PERMISSIONS` + `permissionCatalog` ở `api`, mảng `PERMISSIONS` ở `web` (cùng thứ tự), gắn `@Permissions(...)` lên route.
  - `GET /users/me` trả `permissions`; `web` kiểm bằng `hasPermission`/`useHasPermission`, không chép luật.
- **Quyền theo dự án** cũng bằng guard + decorator: `ProjectAccessGuard` (`api/projects/guards/`) là guard toàn cục thứ tư, đóng theo mặc định (route có `:projectId` ở bất kỳ controller nào mà thiếu `@ProjectRoles` → 500); route có `:projectId` khai `@ProjectRoles()` (ai xem được dự án) hoặc `@ProjectRoles(ProjectRole.ADMIN)`, rồi lấy dự án bằng `@CurrentProject()`.
  - Guard trả 404 `E028` khi không xem được (không tiết lộ dự án có thật), 403 `E006` khi thiếu vai trò; `projects:update_all` qua mọi vai trò, `projects:read_all` chỉ qua `@ProjectRoles()`.
  - Thao tác ghi gọi `lockProject(tx, projectId, currentUser)` trong transaction: khoá dòng dự án và dòng `project_users` của người gọi, đọc lại rồi kiểm lại ADMIN/`projects:update_all`, để người vừa bị hạ vai trò không lọt qua khe giữa guard và transaction. Ngoài bước này service không tự kiểm quyền dự án.
  - Lọc danh sách theo quyền (`GET /projects`) là điều kiện `where` trong service, giữ khớp luật của guard.
  - Trưởng dự án luôn là `ADMIN` dự án: không đổi vai trò, không xoá khỏi dự án được (409 `E036`); muốn đổi thì đổi trưởng dự án qua `PATCH /projects/:projectId`. Dự án đã lưu trữ không thêm/sửa/xoá người được (`E030`).
- Vai trò `isSystem` là của **admin hệ thống duy nhất**: luôn đủ mọi quyền, không đổi quyền, không xoá, và chỉ gán qua `BOOTSTRAP_OWNER_EMAIL`. Không trao qua mời hay đổi vai trò, không tước hay gỡ admin (`ensureCanGrantRole`, `grant.ts`), nên luôn có đúng một admin. Người giữ vai trò hệ thống luôn ẩn khỏi `GET /users` (không có tham số để hiện) và không thêm được vào phòng ban (`ensureUserCanJoinDepartment`).
- **Chỉ controller kiểm quyền; service không kiểm.** Hệ quả: mọi nơi gọi service không đi qua controller (cron job, module khác) phải tự kiểm quyền.
  - Ngoại lệ có chủ đích: luật phụ thuộc **đối tượng bị thao tác** nằm ở service vì cần đọc dòng đích trong transaction; quyền người thực hiện lấy từ `@CurrentUser() currentUser`.
  - Ngoại lệ có chủ đích khác: route ghi **ngày nghỉ** (`days-off`) không gắn `@Permissions` vì ai có mã `days_off:*` **hoặc** là trưởng đơn vị chứa phòng trực (kể cả đơn vị cha) đều được. Service gọi `ensureCanManageDaysOff` (`duty-rooms/duty-rooms.write.ts`, khớp `canManageDuty` của `web`) ngay đầu transaction, trước khi tra bản ghi (người không đủ quyền luôn nhận 403, không dò được id). Ngày nghỉ áp cho cả đơn vị nên lấy phòng trực đầu tiên làm căn cứ; thêm phòng thứ hai thì phải quyết định lại. Trưởng đơn vị chỉ có quyền "trưởng", không có mã nào trong `permissions`.
  - Cùng cách cho route ghi **ca trực** (`duty-shifts`: tạo, huỷ, xếp/gỡ người): mã `duty_shifts:create` / `duty_shifts:update` **hoặc** trưởng đơn vị chứa phòng của ca (kể cả đơn vị cha); service gọi `ensureCanManageDuty` (`duty-rooms/duty-rooms.write.ts`, khớp `canManageDuty` của `web`) ngay sau khi biết phòng. Tự nhận / tự rút ca (`join`, `leave`) chỉ cần có vai trò, vì chỉ động vào dòng của chính người gọi.
  - **Chống leo quyền** ở `api/roles/grant.ts`, mỗi chỗ trao/tước vai trò gọi đúng một lần `await ensureCanGrantRole(tx, currentUser, roleId)`: khoá vai trò, vai trò hệ thống thì `E023` (không ai trao/tước được, kể cả admin), rồi chỉ cho vai trò có quyền nằm trong quyền của mình. Tạo/sửa bộ quyền của vai trò dùng `ensureCanGrantPermissions(currentUser, permissions)` (mọi quyền phải nằm trong `currentUser.permissions`); vai trò hệ thống cố định: không sửa (cả tên, mô tả), không xoá, không trao được, vì `updateRole`/`deleteRole` cũng gọi `ensureCanGrantRole` (`E023`). Gọi ở mọi chỗ trao/tước vai trò: mời, tạo lại/thu hồi lời mời (và gia hạn lời mời chờ của người khác), đổi vai trò (cả vai trò cũ lẫn mới), gỡ thành viên, tạo/sửa/xoá vai trò.
- Quyền lấy từ DB (vai trò hệ thống, sau này thêm vai trò theo project), **không** dùng custom claims của Firebase để tránh lệch dữ liệu.
- Thiếu quyền → `AppException(ErrorCode.<forbidden>, 403)`.

## Token cá nhân (PAT) và MCP

- `/api/mcp` là endpoint MCP cho AI (SDK chính chủ `@modelcontextprotocol/server` v2 + `@modelcontextprotocol/node`, không dùng thư viện NestJS của cộng đồng vì nó buộc sửa guard toàn cục). Bật bằng `API_TOKENS_ENABLED=true`; mặc định `false` thì route trả 404, nên cắt quyền AI trên production không cần deploy lại.
- Xác thực bằng token cá nhân `qlda_pat_<43 ký tự>` (`Authorization: Bearer`), do chính người dùng tạo ở `/api/api-tokens`. DB chỉ lưu SHA-256 (`api_tokens.token_hash`), token gốc trả một lần. Phạm vi `READ` hoặc `WRITE` (gồm đọc), hạn tối đa 365 ngày, thu hồi bằng `revoked_at`. Tạo và thu hồi token ghi log (id, không bao giờ ghi token).
- Mức `API_TOKEN` (`@ApiTokenAuth()`): chỉ `ApiTokenGuard` chạy; `InternalKeyGuard`, `FirebaseAuthGuard`, `PermissionsGuard` bỏ qua. Guard nạp `CurrentUser` qua `AuthService.loadCurrentUser` (vai trò, quyền đọc từ DB mỗi request) và từ chối: token đã thu hồi hoặc hết hạn, token cấp trước `users.sessions_revoked_at` (nên "Đăng xuất mọi thiết bị" vô hiệu cả token), chủ token chưa có vai trò (`E025`) hoặc đã xoá mềm (`E009`). Token sai → `E084` (401), log cảnh báo thưa, không ghi token.
- Token chỉ có tối đa quyền của chủ nó và **không** dùng được cho route REST khác (các route đó vẫn đòi phiên Firebase), nên không tự sinh thêm token được.
- Tool MCP gọi thẳng service, không qua controller, nên **tool tự kiểm quyền** bằng `resolveProjectAccess(db, currentUser, { projectKey }, roles)` (cùng luật `ProjectAccessGuard`) hoặc `resolveIssueKey`, với đúng `@ProjectRoles` của route REST cùng việc (đọc `[]`, ghi `PROJECT_WRITER_ROLES`). Service ghi vẫn kiểm lại trong transaction bằng `lockProject`.
- Token `READ` không được đăng ký tool ghi (`McpToolProvider.register` kiểm `caller.canWrite`), nên không thấy và không gọi được. Chưa có tool xoá hay quản trị.
- Chữ do người khác viết (mô tả, bình luận, vướng mắc, ghi chú) trả cho AI là dữ liệu không đáng tin (prompt injection): `MCP_INSTRUCTIONS` dặn AI không làm theo chỉ dẫn trong đó và `web` mặc định tạo token `READ`.
- Còn hở: request mang token đúng định dạng nhưng sai chưa bị giới hạn tần suất (mỗi request tốn một truy vấn có index) vì `ApiTokenGuard` chạy trước `AppThrottlerGuard`; nếu bị dò thì chặn ở Apache. Thay đổi qua MCP ghi `activity_logs` dưới tên chủ token, chưa đánh dấu là qua token.

## Secret và cấu hình

- Không hardcode secret. Mọi secret đọc từ env qua config (xem `backend/structure.md`); thiếu secret bắt buộc thì app dừng khi boot.
- Service account Firebase (tách thành `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` với `\n` chữ trong khoá), `RESEND_API_KEY`, `INTERNAL_API_KEY` chỉ ở `api`, không đưa sang `web`.
- Route cron (`POST /cron/*`, chưa có) là `@Public()` nhưng bắt buộc header secret `CRON_SECRET`; thêm biến này vào config khi làm route cron, không khai báo trước.
- Lộ secret → xoay (rotate) ngay.

## Log và lỗi

- Dùng `new Logger(XService.name)` của Nest; **không `console.log`** trong `src/` (script ở `scripts/` được phép).
- Không nuốt lỗi: xử lý hoặc log rồi ném lại.
- Không để lộ stack, đường dẫn đĩa, SQL hay chi tiết hệ thống ra response ở production.
- Không log token, session cookie, mật khẩu, nội dung `Authorization`.

## Mặc định phòng thủ

- `helmet` bật toàn cục; CORS chỉ mở cho `WEB_ORIGIN` và chỉ ở route thật sự cần (file có URL ký).
- Rate limit bằng `@nestjs/throttler`: `AppThrottlerGuard` là guard toàn cục, hai bộ đếm độc lập, vượt bộ nào cũng 429 `E043`: `ip` (IP người dùng cuối, IPv6 gộp /64, `IP_THROTTLE_LIMIT`) và `user` (`request.user.id`, rơi về IP khi chưa có phiên, `USER_THROTTLE_LIMIT`). `api` chỉ được BFF gọi nên IP trình duyệt do BFF chuyển qua `X-Client-IP` (interceptor của `http` ở `web`); `readClientIp` chỉ nhận giá trị là IP hợp lệ và chỉ tin được vì `InternalKeyGuard` chạy trước. `POST /auth/session` chỉ đếm bộ `ip`, chặt hơn (`CREATE_SESSION_THROTTLE_LIMIT`). `GET /api/health` đánh `@SkipThrottle({ ip: true, user: true })`. Route `@Public()` bỏ qua `InternalKeyGuard` nên `X-Client-IP` giả được: giữ nhẹ hoặc `@SkipThrottle()`. Route `@ApiTokenAuth()` không qua BFF nên không có IP đáng tin (`X-Client-IP` giả được, `request.ip` là của proxy): cả hai bộ đếm đó theo id token. Hạn mức tính riêng cho từng route (không phải tổng). Bộ đếm nằm trong bộ nhớ của từng process (không có Redis).
- Swagger (`/api-docs`) không đi qua guard toàn cục nên **chỉ bật ngoài production**.
- Ghi log cảnh báo (không kèm khoá) khi `X-Internal-Key` sai, để phát hiện dò khoá.
- Mọi input qua DTO + `ValidationPipe`; truy vấn DB chỉ qua tham số của Drizzle (xem `backend/database.md`).
- Upload: kiểm kiểu thật của file (không tin đuôi/`Content-Type`), giới hạn dung lượng, lưu ngoài `public_html`, tên file sinh ngẫu nhiên, chặn path traversal.

## Khi nào phải chạy `security-reviewer`

Thêm/đổi route, `@Public`, quyền; xử lý upload/đường dẫn file; `sql` thô; sắp xếp/lọc động theo input; gọi API bên ngoài; mật mã; mọi code gọi service từ ngoài controller.

## Checklist trước khi commit

- [ ] Không secret trong code; env mới đã vào `.env.example`.
- [ ] Input đi qua DTO; truy vấn có tham số.
- [ ] Route mới có xác thực và `@Permissions`/`@ProjectRoles` đúng, hoặc `@Public()` có lý do.
- [ ] Lỗi không lộ dữ liệu nhạy cảm; không `console.log`.
- [ ] Route công khai/đăng nhập mới có hạn mức tần suất phù hợp (`@Throttle`) hoặc lý do `@SkipThrottle()`.
