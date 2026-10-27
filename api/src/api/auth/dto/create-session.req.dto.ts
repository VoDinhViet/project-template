import { StringField } from '../../../decorators/field.decorators.js';

const MAX_ID_TOKEN_LENGTH = 4096;

export class CreateSessionReqDto {
  @StringField({
    description:
      'Firebase ID token vừa lấy sau khi đăng nhập bằng Google hoặc email/mật khẩu',
    maxLength: MAX_ID_TOKEN_LENGTH,
    trim: false,
  })
  idToken!: string;
}
