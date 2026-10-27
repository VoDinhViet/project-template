import { Exclude, Expose } from 'class-transformer';
import { StringField } from '../../../decorators/field.decorators.js';
import { SessionResDto } from './session.res.dto.js';

@Exclude()
export class RefreshedSessionResDto extends SessionResDto {
  @Expose()
  @StringField({
    description:
      'Refresh token để BFF lưu thay cái cũ; Firebase có thể trả lại đúng token đã gửi hoặc token mới',
  })
  refreshToken: string;
}
