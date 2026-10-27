import { z } from 'zod'
import {
  invitationEmailsFormSchema,
  MAX_INVITATION_EMAILS,
} from '@/lib/invitation'

// Khớp `MAX_SEARCH_KEYWORD_LENGTH` của `api`.
const MAX_SEARCH_KEYWORD_LENGTH = 100

export const createInvitationsFormSchema = z.object({
  emails: invitationEmailsFormSchema,
  roleId: z.uuid('Chọn vai trò.'),
  shouldSendEmail: z.boolean(),
})

export const invitationSuggestionsQuerySchema = z.object({
  q: z.string().trim().max(MAX_SEARCH_KEYWORD_LENGTH).optional(),
})

export const createInvitationsSchema = z.object({
  emails: z.array(z.email()).min(1).max(MAX_INVITATION_EMAILS),
  roleId: z.uuid(),
  shouldSendEmail: z.boolean(),
})

export const invitationIdSchema = z.object({
  invitationId: z.uuid(),
})

export const invitationTokenSchema = z.object({
  token: z.string().min(1).max(100),
})

export type CreateInvitationsFormSchema = z.input<
  typeof createInvitationsFormSchema
>
export type CreateInvitationsSchema = z.infer<typeof createInvitationsSchema>
export type InvitationSuggestionsQuery = z.infer<
  typeof invitationSuggestionsQuerySchema
>
export type InvitationIdSchema = z.infer<typeof invitationIdSchema>
