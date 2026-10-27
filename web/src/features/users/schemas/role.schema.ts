import { z } from 'zod'
import { PERMISSIONS } from '@/lib/types/role.type'

// Độ dài khớp `CreateRoleReqDto` ở `api`.
export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nhập tên vai trò.')
    .max(100, 'Tên vai trò quá dài.'),
  description: z
    .string()
    .trim()
    .max(255, 'Mô tả quá dài.')
    .transform((description) => description || undefined),
  permissions: z.array(z.enum(PERMISSIONS)),
})

export const updateRoleSchema = z.object({
  roleId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'Nhập tên vai trò.')
    .max(100, 'Tên vai trò quá dài.'),
  description: z
    .string()
    .trim()
    .max(255, 'Mô tả quá dài.')
    .transform((description) => description || null),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  isDefault: z.boolean().optional(),
})

export const roleIdSchema = z.object({
  roleId: z.uuid(),
})

export type CreateRoleSchema = z.input<typeof createRoleSchema>
export type UpdateRoleSchema = z.input<typeof updateRoleSchema>
export type RoleIdSchema = z.infer<typeof roleIdSchema>
