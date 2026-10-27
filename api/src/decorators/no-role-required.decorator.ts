import { SetMetadata } from '@nestjs/common';

export const IS_NO_ROLE_REQUIRED_KEY = 'isNoRoleRequired';

/** Route người đăng nhập nhưng chưa được mời vẫn cần gọi (hồ sơ của mình, xem/chấp nhận lời mời). */
export const NoRoleRequired = () => SetMetadata(IS_NO_ROLE_REQUIRED_KEY, true);
