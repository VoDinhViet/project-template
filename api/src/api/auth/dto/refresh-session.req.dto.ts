import { StringField } from '../../../decorators/field.decorators.js';

const MAX_REFRESH_TOKEN_LENGTH = 4096;

export class RefreshSessionReqDto {
  @StringField({
    description: 'Refresh token Firebase mà BFF đã lưu lúc đăng nhập',
    maxLength: MAX_REFRESH_TOKEN_LENGTH,
    trim: false,
  })
  refreshToken!: string;
}
