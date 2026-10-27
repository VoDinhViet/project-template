import { CopyIcon } from '@solar-icons/react/linear'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InvitationEmailStatus } from '@/lib/types/invitation.type'

export type InvitationLink = {
  email: string
  link: string
  emailStatus?: InvitationEmailStatus
}

type InvitationLinkListProps = {
  invitationLinks: InvitationLink[]
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch {
    toast.error('Không sao chép được. Hãy chọn link và sao chép thủ công.')
  }
}

/** Link chỉ hiện một lần (DB chỉ lưu hash), nên phải cho sao chép ngay tại đây. */
export function InvitationLinkList({
  invitationLinks,
}: InvitationLinkListProps) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {invitationLinks.map(({ email, link, emailStatus }) => (
          <li key={email} className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {email}
              {emailStatus === 'SENT' && (
                <span className="font-medium text-success-ink">
                  Đã gửi email
                </span>
              )}
              {emailStatus === 'QUEUED' && (
                <span className="font-medium text-warning-ink">
                  Gửi email lỗi, hệ thống sẽ tự gửi lại
                </span>
              )}
              {emailStatus === 'FAILED' && (
                <span className="font-medium text-destructive-ink">
                  Gửi email lỗi
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Input
                readOnly
                value={link}
                aria-label={`Link mời ${email}`}
                className="font-mono text-xs"
                onFocus={(event) => event.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Sao chép link mời ${email}`}
                onClick={() => void copyToClipboard(link, 'Đã sao chép link.')}
              >
                <CopyIcon className="text-info-ink" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {invitationLinks.length > 1 && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() =>
            void copyToClipboard(
              invitationLinks
                .map(({ email, link }) => `${email}: ${link}`)
                .join('\n'),
              'Đã sao chép tất cả link.',
            )
          }
        >
          <CopyIcon className="text-info-ink" />
          Sao chép tất cả
        </Button>
      )}
    </div>
  )
}
