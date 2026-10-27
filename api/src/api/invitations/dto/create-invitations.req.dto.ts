import {
  BooleanFieldOptional,
  EmailField,
  UUIDField,
} from '../../../decorators/field.decorators.js';
import { MAX_INVITATION_EMAILS } from '../invitations.constant.js';

export class CreateInvitationsReqDto {
  @EmailField({
    each: true,
    minItems: 1,
    maxItems: MAX_INVITATION_EMAILS,
    description: `Email người được mời (1–${MAX_INVITATION_EMAILS}, trùng sẽ được gộp)`,
  })
  emails!: string[];

  @UUIDField({
    description:
      'Vai trò sau khi chấp nhận; không mời thẳng vào vai trò hệ thống, chỉ chọn vai trò mình trao được',
  })
  roleId!: string;

  @BooleanFieldOptional({
    description:
      'Gửi email chứa link mời tới những người mới được mời (mặc định không gửi); máy chủ chưa cấu hình Resend thì bỏ qua',
  })
  shouldSendEmail?: boolean;
}
