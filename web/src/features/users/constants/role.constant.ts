import { ShieldUserIcon, UsersGroupRoundedIcon } from '@solar-icons/react/bold'
import type { Icon } from '@solar-icons/react/lib/types'
import type { Permission } from '@/lib/types/role.type'

/** Quyền xoá hoặc tác động lên người/vai trò khác: trang vai trò báo rõ khi được tích. */
export const SENSITIVE_PERMISSIONS: Permission[] = [
  'users:remove',
  'users:assign_role',
  'roles:update',
  'roles:delete',
]

type PermissionGroupStyle = {
  icon: Icon
  /** Màu ô icon của nhóm, cùng bảng màu ngữ nghĩa với các thẻ thống kê. */
  tileClassName: string
}

/** Tra theo `groupName` của danh mục quyền từ `api`; nhóm mới chưa có ở đây thì dùng `defaultPermissionGroupStyle`. */
export const permissionGroupStyles: Record<string, PermissionGroupStyle> = {
  'Thành viên': {
    icon: UsersGroupRoundedIcon,
    tileClassName: 'bg-violet-soft text-violet-ink',
  },
  'Vai trò': {
    icon: ShieldUserIcon,
    tileClassName: 'bg-info-soft text-info-ink',
  },
}

export const defaultPermissionGroupStyle: PermissionGroupStyle = {
  icon: ShieldUserIcon,
  tileClassName: 'bg-neutral-soft text-neutral-ink',
}
