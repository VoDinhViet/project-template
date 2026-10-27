import { Exclude, Expose } from 'class-transformer';
import {
  EnumField,
  StringField,
} from '../../../decorators/field.decorators.js';
import { InvitationStatus } from '../invitations.constant.js';

@Exclude()
export class InvitationEmailResDto {
  @Expose()
  @StringField({
    nullable: true,
    description: 'Email được mời; null khi lời mời không còn dùng được',
  })
  email!: string | null;

  @Expose()
  @EnumField(() => InvitationStatus, {
    enumName: 'InvitationStatus',
    description: 'Trạng thái lời mời; chỉ PENDING mới đăng ký được',
  })
  status!: InvitationStatus;
}
