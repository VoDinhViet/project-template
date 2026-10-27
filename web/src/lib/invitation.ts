import { z } from 'zod'

// Khớp `INVITATION_TTL_DAYS` và `MAX_INVITATION_EMAILS` của `api`.
export const INVITATION_TTL_DAYS = 7
export const MAX_INVITATION_EMAILS = 20

const EMAIL_SEPARATOR = /[\s,;]+/

const emailSchema = z.email()

/** Người dùng dán danh sách từ Excel/Zalo nên chấp nhận phẩy, chấm phẩy hoặc xuống dòng. */
export function parseEmailList(emailsText: string): string[] {
  const emails = emailsText
    .split(EMAIL_SEPARATOR)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
  return [...new Set(emails)]
}

/** Báo một lỗi gộp cho cả ô email, nêu đúng những email sai để người dùng sửa. */
export const invitationEmailsFormSchema = z
  .array(z.string())
  .superRefine((emails, context) => {
    if (emails.length === 0) {
      context.addIssue({ code: 'custom', message: 'Nhập ít nhất một email.' })
      return
    }
    if (emails.length > MAX_INVITATION_EMAILS) {
      context.addIssue({
        code: 'custom',
        message: `Mỗi lần mời tối đa ${MAX_INVITATION_EMAILS} email.`,
      })
      return
    }
    const invalidEmails = emails.filter(
      (email) => !emailSchema.safeParse(email).success,
    )
    if (invalidEmails.length > 0) {
      context.addIssue({
        code: 'custom',
        message: `Email không hợp lệ: ${invalidEmails.join(', ')}`,
      })
    }
  })

/** Link dựng ở trình duyệt nên đúng tên miền người mời đang dùng, không cần cấu hình thêm. */
export function buildInvitationLink(token: string): string {
  return `${window.location.origin}/invitations/${token}`
}
