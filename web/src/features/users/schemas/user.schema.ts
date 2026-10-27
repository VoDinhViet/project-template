import { z } from 'zod'

export const userIdSchema = z.object({
  userId: z.uuid(),
})

export const updateUserRoleSchema = z.object({
  userId: z.uuid(),
  roleId: z.uuid(),
})

export type UserIdSchema = z.infer<typeof userIdSchema>
export type UpdateUserRoleSchema = z.infer<typeof updateUserRoleSchema>
