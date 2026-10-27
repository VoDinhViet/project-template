import { Link } from '@tanstack/react-router'

/** Route kiểm quyền ở `beforeLoad` rồi chuyển về đây; `api` vẫn trả 403 nếu gọi thẳng. */
export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-start gap-3 p-4 sm:p-5 lg:p-6">
      <h1 className="text-xl font-bold">Không có quyền truy cập</h1>
      <p className="text-sm text-muted-foreground">
        Vai trò của bạn chưa được mở trang này. Hãy nhờ người quản lý vai trò
        cấp thêm quyền nếu cần.
      </p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Về trang chủ
      </Link>
    </div>
  )
}
