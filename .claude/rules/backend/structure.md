---
paths:
  - "api/**"
---

# Backend — cấu trúc và phân lớp

Bám theo `be-quanlysanxuat`. Mọi đường dẫn dưới đây tính từ `api/`.

## Layout `src/`

```
main.ts  app.module.ts
api/<domain>/              một thư mục mỗi domain, kebab-case, số nhiều (clients, purchase-orders)
  <domain>.module.ts  .controller.ts  .service.ts
  <domain>.query.ts        hàm thuần đọc dữ liệu dùng chung (join, subquery), nhận Database | DbTransaction
  <domain>.write.ts        hàm thuần ghi trong transaction, nhận tx (tránh import vòng giữa module)
  <domain>.constant.ts  *.util.ts
  <domain>.tools.ts        provider tool MCP của domain (`McpToolProvider`), gọi service cùng module; khai ở `providers` + `exports`
  dto/                     *.req.dto.ts  *.res.dto.ts
  config/  guards/  types/  khi cần
common/dto/                ErrorDto, ErrorDetailDto, offset-pagination
common/utils/              extract-mysql-error, has-fields, ...
config/                    app.config.ts + app-config.type.ts + config.type.ts (AllConfigType)
constants/                 error-code.constant.ts (ErrorCode), app.constant.ts, permission.constant.ts
database/                  database.module.ts (token DRIZZLE), database.type.ts, config/, schemas/<domain>/*.ts, seeds/
decorators/                field.decorators.ts, http.decorators.ts, public.decorator.ts, current-user, ...
exceptions/app.exception.ts
filters/global-exception.filter.ts  to-error-dto.ts
utils/                     validate-config.ts, swagger.ts, validation-pipe.ts, configure-app.ts
```

- Code dùng chung cho cả app (decorator, filter, exception, constant) nằm ở **cấp cao nhất của `src/`**, không đặt trong `api/`.
- Guard thuộc domain xác thực nằm ở `api/auth/guards/`. Không có thư mục `guards/` hay `interceptors/` cấp cao nhất.
- Tổ chức theo **domain**, không theo loại file. Nhiều file nhỏ tốt hơn vài file lớn: file nguồn < 800 dòng, hàm < 50 dòng, lồng không quá 4 tầng (dùng early return).

## Phân lớp

- **Controller mỏng**: chỉ decorator rồi `return this.xService.method(...)`. Không logic, không `try/catch`. Luôn khai báo kiểu trả về (`Promise<void>`, `Promise<XResDto>`).
- **Service** giữ toàn bộ nghiệp vụ và gọi Drizzle trực tiếp. **Không có lớp repository.** Truy vấn dùng chung đặt ở `*.query.ts` / `*.write.ts` là **hàm thuần**, không phải provider.
- Service nhận `userId` làm tham số khi cần ghi cột audit; không tự đọc request.
- Gọi chéo module trong transaction: viết hàm thuần nhận `tx: DbTransaction` ở `*.write.ts` thay vì inject service của module kia (tránh vòng DI).
- Module `exports: [XService]` (kèm `XTools` nếu có tool MCP); chỉ import module khác khi thật sự inject service của nó. `DatabaseModule` là `@Global()`.
- **MCP** (`api/mcp/`): chỉ giữ hạ tầng (controller `/api/mcp`, `McpService` dựng `McpServer` mới cho mỗi request, `registerMcpTool`, `resolveIssueKey`, `rich-text.ts`). Tool nằm trong module domain (`<domain>.tools.ts`), `McpModule` import các module đó. Tên tool camelCase **trùng tên method service/controller**; input vừa có schema `zod` (mô tả cho AI) vừa đi qua `validateReqDto(<ReqDto REST>, input)` để DTO class-validator vẫn là nguồn validate duy nhất; mọi tool đăng ký bằng `registerMcpTool`, không gọi `server.registerTool` trực tiếp. Xem `backend/auth-security.md` mục "Token cá nhân (PAT) và MCP".
- Thêm module mới bằng CLI: `npx nest g resource <tên> --no-spec` rồi chỉnh theo layout trên (không để file `.spec.ts`, xem `common/pause-test.md`).

## Config và biến môi trường

- Mỗi config là một factory `registerAs('x', () => { validateConfig(process.env, XEnvValidator); return {...}; })` kèm lớp validator dùng class-validator và file `x-config.type.ts`.
- Mọi config gom vào `AllConfigType` (`config/config.type.ts`) và liệt kê trong `ConfigModule.forRoot({ isGlobal: true, load: [...] })`.
- Đọc giá trị bằng `configService.getOrThrow('x.y', { infer: true })` với `ConfigService<AllConfigType>`. Không đọc `process.env` trực tiếp ngoài file config; ngoại lệ có chủ đích: `app.module.ts` (chọn `envFilePath`), `drizzle.config.ts` (chạy ngoài Nest).
- Config thuộc domain nào thì đặt trong thư mục domain đó (`api/auth/config/`, `database/config/`).
- Thiếu biến bắt buộc → app **dừng ngay khi boot**. Thêm biến mới thì phải thêm vào `.env.example`.
- Nạp file env: `.env.${NODE_ENV || 'local'}`, rồi `.env.local`, rồi `.env`; trên hosting không upload các file này mà đặt biến trong cPanel. `NODE_ENV` trong config mặc định **`production`** khi thiếu (Swagger tắt); `start:dev` và `start:debug` đặt `NODE_ENV=local`. `INTERNAL_API_KEY` (và secret khác) không được bắt đầu bằng `change-me`. Không commit file `.env*` (trừ `.env.example`).

## Checklist

- [ ] Domain mới nằm trong `src/api/<domain>/` với đủ module/controller/service/dto.
- [ ] Controller không chứa logic; service không kiểm quyền (xem `backend/auth-security.md`).
- [ ] Biến env mới có validator, có trong `AllConfigType` và `.env.example`.
- [ ] Không file nào > 800 dòng, không hàm nào > 50 dòng.
