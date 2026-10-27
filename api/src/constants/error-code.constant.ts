/**
 * Mã lỗi nghiệp vụ (`E###`) và lỗi validate (`V###`); giá trị là khoá mà `web` ánh xạ sang thông báo.
 *
 * Rules:
 * - Thêm mã mới ở cuối, không đánh lại số.
 * - Mã đã bỏ không dùng lại: để lại dòng comment ghi số đã retire.
 */
export enum ErrorCode {
  // E028–E053 và E056–E085 đã bỏ khi dựng template (domain dự án, tổ chức, lịch trực, token); E087 cũng bỏ.
  E001 = 'common.error.internal',
  E002 = 'common.error.not_found',
  E003 = 'common.error.duplicate_entry',
  E004 = 'common.error.reference_conflict',
  E005 = 'auth.error.invalid_internal_key',
  E006 = 'auth.error.forbidden',
  E007 = 'common.error.payload_too_large',
  E008 = 'auth.error.unauthenticated',
  E009 = 'auth.error.account_disabled',
  E010 = 'auth.error.email_not_verified',
  E011 = 'auth.error.provider_not_allowed',
  E012 = 'auth.error.email_in_use',
  // E013 (`member_already_exists`) đã bỏ: thêm thành viên chỉ còn qua lời mời.
  // E014 (`organization.error.last_owner`) đã bỏ: không còn tổ chức.
  // E015 (`user_not_registered`) đã bỏ: lời mời không cần người nhận đã có tài khoản.
  E016 = 'invitation.error.not_found',
  E017 = 'invitation.error.expired',
  E018 = 'invitation.error.revoked',
  E019 = 'invitation.error.already_accepted',
  E020 = 'invitation.error.email_mismatch',
  E021 = 'role.error.not_found',
  E022 = 'role.error.in_use',
  E023 = 'role.error.system_role_locked',
  E024 = 'common.error.concurrent_update',
  E025 = 'auth.error.no_access',
  // E026 (`role.error.last_full_access_user`) đã bỏ: admin hệ thống không đổi/gỡ được nên luôn còn
  // (xem `ensureCanGrantRole`), trả E023.
  E027 = 'role.error.name_exists',
  E043 = 'common.error.too_many_requests',
  E054 = 'user.error.not_found',
  E086 = 'role.error.default_locked',
  E088 = 'auth.error.invalid_cron_secret',
  V001 = 'common.validation.failed',
  V002 = 'common.validation.empty_update_payload',
}
