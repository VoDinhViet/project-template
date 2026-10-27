import { CardSkeleton } from './CardSkeleton'

/** Trang chờ mặc định của router: chỉ phần thân, vì có route đặt trong khung trang đã có tiêu đề. */
export function PagePending() {
  return (
    <div aria-busy className="w-full p-4 sm:p-5 lg:p-6">
      <span role="status" className="sr-only">
        Đang tải…
      </span>
      <CardSkeleton hasHeader />
    </div>
  )
}
