import { SetMetadata } from '@nestjs/common';

export const IS_INTERNAL_ONLY_KEY = 'isInternalOnly';

/** Route chỉ cần `X-Internal-Key` của BFF, không cần phiên người dùng (đổi ID token lấy session cookie, đọc email lời mời trước khi đăng nhập). */
export const InternalOnly = () => SetMetadata(IS_INTERNAL_ONLY_KEY, true);
