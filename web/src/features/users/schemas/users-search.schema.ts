import { z } from 'zod'
import { MAX_PAGE_LIMIT } from '@/lib/constants'

// `.catch` để URL sai không gây lỗi.
export const usersSearchSchema = z.object({
  page: z.number().int().min(1).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  tab: z.enum(['users', 'invitations', 'roles']).optional().catch(undefined),
  roleId: z.uuid().optional().catch(undefined),
})

export const usersQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  // Ô chọn người và bảng tra tên lấy nhiều hơn một trang bảng.
  limit: z.number().int().min(1).max(MAX_PAGE_LIMIT).optional(),
  q: z.string().optional(),
  roleId: z.uuid().optional(),
})

export const invitationsQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  q: z.string().optional(),
})

export type UsersSearch = z.infer<typeof usersSearchSchema>
export type UsersQuery = z.infer<typeof usersQuerySchema>
export type InvitationsQuery = z.infer<typeof invitationsQuerySchema>
