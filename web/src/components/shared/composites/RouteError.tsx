import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { GENERIC_ERROR_MESSAGE } from '@/lib/error-messages'

// Chỉ hiện câu chung: lỗi gốc có thể chứa chữ tiếng Anh/kỹ thuật không nên lộ ra UI.
export function RouteError() {
  const router = useRouter()

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 p-4 sm:p-5 lg:p-6"
    >
      <p className="text-sm">{GENERIC_ERROR_MESSAGE}</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => void router.invalidate()}
      >
        Thử lại
      </Button>
    </div>
  )
}
