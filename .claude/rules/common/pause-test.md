# Pause Test

Dự án này **tạm dừng viết test** cho cả backend (`api/`) và frontend (`web/`).

- Không viết unit test, integration test, e2e test; không làm TDD; không yêu cầu coverage 80%.
- Rule này **ghi đè** các mục TDD / coverage trong `development-workflow.md`, `code-review.md` và `testing.md` ở cấp global.
- Khi scaffold: xoá file test mẫu do CLI sinh ra, tắt sinh `*.spec.ts` (`nest-cli.json` → `generateOptions.spec: false`, dùng `nest g ... --no-spec`), không cài Jest / Vitest / Playwright.
- Thay cho test, kiểm tra chất lượng bằng `lint` + `typecheck` + `build`, và thử thủ công qua Swagger `/api-docs` và trình duyệt.
- Rule hết hiệu lực khi người dùng yêu cầu bật lại test.
