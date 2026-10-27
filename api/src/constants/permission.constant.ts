/**
 * Mã quyền dạng `resource:action`; vai trò nào có quyền gì do hệ thống tự cấu hình (`role_permissions`).
 *
 * Rules:
 * - Bỏ một mã thì phải kèm migration xoá các dòng quyền đang mang mã đó.
 */
export const PERMISSIONS = [
  'users:read',
  'users:invite',
  'users:remove',
  'users:assign_role',
  'roles:read',
  'roles:create',
  'roles:update',
  'roles:delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

type PermissionInfo = {
  groupName: string;
  name: string;
  description: string;
};

/** `Record` để thêm mã mới mà quên mô tả thì typecheck báo; màn hình phân quyền hiển thị theo bảng này. */
export const permissionCatalog: Record<Permission, PermissionInfo> = {
  'users:read': {
    groupName: 'Thành viên',
    name: 'Xem trang Người dùng',
    description:
      'Xem trang quản lý người dùng: thống kê, vai trò và hoạt động. Danh sách gọn để chọn người thì ai có vai trò cũng đọc được',
  },
  'users:invite': {
    groupName: 'Thành viên',
    name: 'Mời thành viên',
    description: 'Tạo, tạo lại và thu hồi lời mời vào hệ thống',
  },
  'users:remove': {
    groupName: 'Thành viên',
    name: 'Gỡ thành viên',
    description: 'Gỡ quyền truy cập hệ thống của thành viên',
  },
  'users:assign_role': {
    groupName: 'Thành viên',
    name: 'Đổi vai trò thành viên',
    description: 'Gán vai trò khác cho thành viên',
  },
  'roles:read': {
    groupName: 'Vai trò',
    name: 'Xem vai trò',
    description:
      'Xem danh sách vai trò và quyền của từng vai trò; cần để mời hay đổi vai trò thành viên',
  },
  'roles:create': {
    groupName: 'Vai trò',
    name: 'Tạo vai trò',
    description: 'Tạo vai trò mới với các quyền mình đang có',
  },
  'roles:update': {
    groupName: 'Vai trò',
    name: 'Sửa vai trò',
    description: 'Đổi tên, mô tả và quyền của vai trò mình trao được',
  },
  'roles:delete': {
    groupName: 'Vai trò',
    name: 'Xoá vai trò',
    description: 'Xoá vai trò không còn ai giữ',
  },
};
