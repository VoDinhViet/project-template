import { Exclude, Expose } from 'class-transformer';
import {
  EnumField,
  StringField,
} from '../../../decorators/field.decorators.js';
import {
  InvitationEmailStatus,
  InvitationResultStatus,
} from '../invitations.constant.js';

@Exclude()
export class InvitationResultResDto {
  @Expose()
  @StringField({ description: 'Email được mời' })
  email!: string;

  @Expose()
  @EnumField(() => InvitationResultStatus, {
    enumName: 'InvitationResultStatus',
    description:
      'Kết quả mời của email này: INVITED là đã tạo hoặc gia hạn lời mời, ALREADY_HAS_ACCESS là người đã có vai trò trong hệ thống',
  })
  status!: InvitationResultStatus;

  @Expose()
  @StringField({
    description:
      'Token của link mời, chỉ trả một lần; null khi không tạo link mới (người đã có vai trò trong hệ thống)',
    nullable: true,
  })
  token!: string | null;

  @Expose()
  @EnumField(() => InvitationEmailStatus, {
    enumName: 'InvitationEmailStatus',
    description:
      'Kết quả gửi email mời; QUEUED khi gửi lỗi và hệ thống sẽ tự gửi lại; NOT_REQUESTED khi không yêu cầu hoặc đã là thành viên, DISABLED khi máy chủ chưa cấu hình gửi email',
  })
  emailStatus!: InvitationEmailStatus;
}
