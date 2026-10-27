import { Link } from '@tanstack/react-router'

export function RouteNotFound() {
  return (
    <div className="flex flex-col items-start gap-3 p-4 sm:p-5 lg:p-6">
      <p className="text-sm">Không tìm thấy trang bạn yêu cầu.</p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Về trang chủ
      </Link>
    </div>
  )
}
