import { CheckCircleIcon, CopyIcon } from '@solar-icons/react/linear'
import { useEffect, useState } from 'react'
import type { ComponentProps } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const COPIED_FEEDBACK_MS = 2000

type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  'type' | 'onClick' | 'aria-label'
> & {
  text: string
  label: string
  successMessage: string
}

/** Dấu tích sau khi chép để người dùng biết đã xong, vì toast dễ bị bỏ lỡ. */
export function CopyButton({
  text,
  label,
  successMessage,
  variant = 'outline',
  size = 'icon',
  children,
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) {
      return
    }
    const timeoutId = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timeoutId)
  }, [isCopied])

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast.success(successMessage)
    } catch {
      toast.error(
        'Không sao chép được. Hãy chọn nội dung và sao chép thủ công.',
      )
    }
  }

  const StateIcon = isCopied ? CheckCircleIcon : CopyIcon

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-label={label}
      onClick={() => void copyText()}
      {...props}
    >
      <StateIcon />
      {children && (isCopied ? 'Đã chép' : children)}
    </Button>
  )
}
