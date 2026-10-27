import { z } from 'zod'

// Token lời mời dài 43 ký tự; giới hạn rộng như `invitationTokenSchema` của feature users.
export const invitationEmailTokenSchema = z.object({
  token: z.string().min(1).max(100),
})
