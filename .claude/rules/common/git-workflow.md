# Luồng Git

Dự án chỉ có **một developer**, nên chỉ dùng **một nhánh `main`** ở cả `api/` và `web/`: không feature branch, không `develop`, không PR.
Rule này **ghi đè** phần nhánh/PR của `git-workflow.md` global.

## Nhánh và commit

- Commit thẳng lên `main`. Mỗi project (`api/`, `web/`) là một repo riêng, commit ở đúng repo.
- Mỗi commit là **một đơn vị hoàn chỉnh và nhỏ** (một tính năng, một lần sửa lỗi hoặc một refactor) và build được. Không commit code dở; việc dở thì `git stash` hoặc để chưa commit.
- **Cổng trước khi commit** (xem `common/project-overrides.md`): `pnpm typecheck` + `pnpm lint` + kiểm định dạng (`pnpm format:check`) pass ở repo sắp commit, thêm `pnpm build` khi đổi build, route hoặc DTO công khai.
- Trước `git add`, xem `git status`: không được có `.env*` (trừ `.env.example`), `dist/`, `.output/`, `node_modules/` hay secret. Thêm file cụ thể, không `git add -A` mù.

## Message

Conventional Commits, tiếng Anh: `type(scope): mô tả`.

- `type`: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `ci`.
- `scope`: domain backend (`issues`, `auth`) hoặc feature frontend (`health`); bỏ qua nếu thay đổi chung.
- Mô tả viết thường, thể mệnh lệnh, không dấu chấm cuối. Body (nếu cần) nói **tại sao**, không nhắc lại diff.
- Không thêm `Co-Authored-By`.

## Thay đổi contract xuyên hai repo

Đổi route/DTO công khai ở `api` kéo theo sửa tay kiểu/schema ở `web` (không có code sinh tự động):

1. Commit `api` trước.
2. Sửa `web` cho khớp rồi commit với **cùng scope và mô tả** để dò được cặp commit.

## Lịch sử

- Không `push --force`. Không `rebase` hay `commit --amend` commit **đã push**; hoàn tác bằng `git revert`.
- Commit **chưa push** thì được `--amend` để sửa commit cuối.

## Tag và deploy

- **Push `main` là deploy production**: GitHub Actions (`.github/workflows/deploy.yml` của từng repo) chạy cổng
  kiểm tra, build, deploy qua SSH forced command `~/bin/qlda-deploy-<api|web>.sh` (tự migrate có dump trước, health
  check, tự rollback), rồi **tự đánh tag** annotated `vX.Y.Z` ("deploy: <subject commit>"). Không tag tay.
- Tăng số (CI tự tính): có `feat` kể từ tag trước → minor, còn lại → patch. Hai repo đánh số độc lập. Breaking
  change sau `1.0.0` → major: tag tay rồi để CI tăng tiếp.
- Commit chỉ thay `**/*.md`, `.claude/**`, `docs/**` không kích hoạt deploy. Chạy lại tay: "Run workflow".
- **Rollback**: qua key deploy `ssh <host> rollback` (về bản phát hành trước trong `~/releases/qlda-*/`, không hoàn
  DB), hoặc `git revert` rồi push. Migration vì vậy phải tương thích ngược (chỉ thêm).
- **Sửa nóng**: commit bản sửa lên `main` rồi push.

## Remote

GitHub private `VoDinhViet/smart-things-tasks-api` và `VoDinhViet/smart-things-tasks-web` (`origin`). Vì push là
deploy, `git push` **chỉ chạy khi người dùng yêu cầu**; `api` push trước `web` khi đổi contract.

## Claude

Theo `common/project-overrides.md`: **không tự commit, push hay tag** khi chưa được yêu cầu rõ ràng. Khi được yêu cầu: chạy cổng kiểm tra, kiểm `git status`, thêm file cụ thể, đề xuất message đúng quy ước, commit trên `main`.

## Checklist

- [ ] Đang ở `main`, đúng repo (`api/` hoặc `web/`).
- [ ] `typecheck` + `lint` (+ `build` nếu cần) đã pass.
- [ ] `git status` không có `.env*`, `dist/`, `.output/`, secret.
- [ ] Message đúng `type(scope): mô tả`, không `Co-Authored-By`.
- [ ] Đổi contract: `api` commit trước, `web` commit sau với cùng scope.
- [ ] Sau push: run "Deploy" trên GitHub xanh, tag `vX.Y.Z` mới xuất hiện.
