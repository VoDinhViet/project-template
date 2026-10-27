---
paths:
  - "api/src/api/**"
  - "api/src/decorators/**"
  - "api/src/common/**"
  - "api/src/filters/**"
  - "api/src/exceptions/**"
  - "api/src/constants/**"
---

# Backend — API, DTO, lỗi

## Route

- REST, tài nguyên số nhiều, prefix toàn cục `api` cho mọi route, kể cả `GET /api/health` (trên hosting `api` chỉ nhận `/api/*` của tên miền chung với `web`).
- `GET /xs` (phân trang) · `GET /xs/:xId` · `POST /xs` · `PATCH /xs/:xId` · `DELETE /xs/:xId`.
- **Mỗi entity chỉ hai API đọc** (ngoại lệ có chủ đích: `GET /invitations/:token/email` đọc email lời mời trước khi đăng nhập, `@InternalOnly()`): `GET /xs` phân trang trả **dữ liệu tối thiểu** (`PageXResDto`), dùng cho cả bảng lẫn ô chọn (ô chọn tìm phía server bằng `q` + `limit`); `GET /xs/:xId` trả chi tiết (`XResDto`), chỉ thêm khi có màn hình cần. **Không** tạo `GET /xs/options`. Ô chọn cần khác bảng một chút thì thêm tham số lọc (`GET /users?roleId=...`), không thêm endpoint; đừng thêm tham số khi chưa có màn hình cần.
- Hành động nghiệp vụ: `POST /xs/:xId/approve`, `POST /xs/:xId/reject`.
- Đường tĩnh (`stats`, `export-excel`) **khai báo trước** `:xId`.
- Mọi route có `@ApiTags`, `@ApiAuth(...)` hoặc `@ApiPublic(...)` (`decorators/http.decorators.ts`).
- `operationId` = tên method của controller (cấu hình `operationIdFactory` trong `utils/swagger.ts`), nên **tên method controller phải duy nhất toàn app** (`getClients`, `getHealth`...).

## Response — không bọc envelope

- Chi tiết: trả thẳng DTO (`XResDto`).
- Danh sách: `OffsetPaginatedDto<PageXResDto>` = `{ data, pagination: { limit, currentPage, nextPage?, previousPage?, totalRecords, totalPages } }`.
- `POST` tạo, `PATCH`, `DELETE`: trả **204 No Content** (`void`), không đọc lại bản ghi vừa ghi. Ngoại lệ có chủ đích trả **200 + body**: `POST /auth/session` (`sessionCookie`, `expiresInMs`) vì BFF phải nhận cookie để tự đặt; `POST /invitations` và `POST /invitations/:invitationId/regenerate` vì token link mời chỉ trả được một lần (DB chỉ lưu hash); `POST /duty-shifts` vì một lần tạo lặp tuần có thể bỏ tuần rơi vào ngày nghỉ nên phải trả `createdCount` và `skippedDates`; `POST /api-tokens` vì token cá nhân chỉ trả được một lần (DB chỉ lưu hash).
- Danh sách phân trang kế thừa `PageOptionsDto { limit = 10, page = 1, q?, order? }`. **`limit` tối đa 100** — người gọi không qua HTTP (job, module khác) cũng phải tự giới hạn.

## Lỗi

- Nghiệp vụ: ném `new AppException(ErrorCode.E009, HttpStatus.NOT_FOUND)`. Thông điệp thường bỏ trống; FE ánh xạ theo `errorCode`.
- Mã trạng thái: không tồn tại 404 · trùng/sai trạng thái chuyển 409 · input sai 422 · không đủ quyền 403 · chưa xác thực 401 · còn lại 400.
- `GlobalExceptionFilter` (`filters/`) chỉ điều phối và ghi log; ánh xạ lỗi sang `ErrorDto` nằm ở `filters/to-error-dto.ts` (hàm thuần `toErrorDto` gọi các hàm `handle*` theo loại lỗi: validate, HTTP, MySQL, lỗi lạ; `AppException` và 413 viết thẳng) để tool MCP dùng chung, lỗi giống hệt giữa REST và MCP. Ngoài production ghi log debug, 5xx ghi `error` kèm stack, response không bao giờ chứa stack hay `message` gốc của lỗi lạ.
- `GlobalExceptionFilter` luôn trả `ErrorDto { timestamp, statusCode, error, errorCode?, message, details?[{ property, code, message }] }`.
- Validate sai trả **422** "Validation failed" kèm `details`. Lỗi MySQL: 1062 → 409, 1451/1452 → 400. Body quá lớn → 413 (`E007`). `.set({})` rỗng của Drizzle → 400 (`V002`). Lỗi không rõ → 500, log đầy đủ nhưng **không lộ** stack hay chi tiết ra ngoài.
- Dữ liệu người dùng tự nhập mà phải duy nhất (tên, mã) có **mã lỗi riêng theo entity** (`role.error.name_exists`), ném từ `validateXUniqueness` trong service. `E003` (`common.error.duplicate_entry`) chỉ còn cho race giữa hai lần ghi, nên `web` không được dịch nó thành thông báo của một entity cụ thể (cùng mã có thể đến từ bảng khác).
- `ErrorCode` thêm mã mới ở cuối `constants/error-code.constant.ts`; không dùng lại số đã bỏ (để lại comment).

## DTO và validate

- `ValidationPipe` toàn cục: `{ transform: true, whitelist: true, exceptionFactory }` (`utils/validation-pipe.ts`) ném 422 và giữ nguyên `ValidationError[]` để filter dựng `details`.
- **Field của request chỉ dùng decorator** trong `decorators/field.decorators.ts`, không dùng class-validator thô:
  `StringField`, `NumberField`, `BooleanField`, `EnumField(() => Enum)`, `UUIDField`, `DateField`, `DateOnlyField` (ngày `YYYY-MM-DD`), `EmailField`, `ClassField(() => Cls, { each })` và bản `*Optional`. Viết như `be-quanlysanxuat`: mỗi decorator tự dựng mảng `Type()`, validator, `ApiProperty` và cách xử lý `null`, không qua hàm dùng chung; bản `*Optional` là `IsOptionalField` cộng bản thường với `required: false`. Transform (`Trim`, `ToLowerCase`...) ở `decorators/transform.decorators.ts`, validator riêng (`IsNullable`, `IsOptionalField`) ở `decorators/validators/`.
  Cần kiểu field mới thì thêm decorator vào file này, không rải decorator thô trong DTO.
  `EnumField`/`EnumFieldOptional` **bắt buộc truyền `enumName`** (tên schema enum trong Swagger, ví dụ `'DatabaseStatus'`), nếu không Swagger tự đặt tên như `HealthResDtoDb`.
- Hành vi đã chốt của decorator: `each: true` **ép giá trị phải là mảng**; `*Optional` bỏ qua `undefined`, còn `null` bị từ chối trừ khi khai báo `nullable: true` (khác `IsOptional()` của class-validator, vốn bỏ qua cả `null`); `StringField` cắt khoảng trắng mặc định (`trim: false` để tắt); `ClassField` bắt buộc thêm `IsDefined` vì `ValidateNested` bỏ qua `undefined`; phần tử sai kiểu trong mảng cho 422 chứ không được làm transform ném lỗi.
- Request DTO là class thuần, field `!` (bắt buộc) hoặc `?`. Field nhận `null` khai báo `nullable: true` và kiểu `T | null`.
- **Update DTO viết tay**, mọi field tuỳ chọn; không dùng `PartialType`. Trước `.set()` phải kiểm `hasFields(reqDto)`. Cần giá trị sau khi sửa để kiểm luật (ngày bắt đầu ≤ hạn...): `{ ...entity, ...omitBy(reqDto, isUndefined) }` (`lodash-es`) — `undefined` là giữ giá trị cũ, `null` là xoá; không viết `reqDto.x === undefined ? cũ : mới` từng field.
- Response DTO: `@Exclude()` ở class, `@Expose()` + decorator field ở từng field; map bằng `plainToInstance(Dto, entity, { excludeExtraneousValues: true })`. Reference gọn dựng bằng `PickType(XResDto, [...] as const)`.
- Route param: `@UUIDParam('clientId')` (id sai định dạng trả **404** như id không tồn tại, không phải 400). Mô tả field đặt trong `description` của decorator, không dùng doc comment.

## Contract với `web`

- Prefix và ngoại lệ của route nằm ở `utils/configure-app.ts`.
- `web` viết tay kiểu và lời gọi theo DTO (không sinh code từ OpenAPI). Sau khi đổi route/DTO công khai phải sửa tay phía `web` tương ứng; không đổi tên field/enum đang được `web` dùng mà không sửa `web` cùng lúc.

## Checklist

- [ ] Route đúng quy ước, đường tĩnh trước `:xId`, có `@ApiAuth/@ApiPublic`, tên method controller duy nhất.
- [ ] Ghi trả 204; danh sách có trần `limit` 100; không bọc envelope.
- [ ] Lỗi nghiệp vụ ném `AppException` với `ErrorCode`.
- [ ] Field request dùng decorator ở `field.decorators.ts`; response DTO có `@Exclude/@Expose`.
- [ ] Nếu đổi contract: đã sửa tay kiểu/schema/lời gọi tương ứng ở `web`.
