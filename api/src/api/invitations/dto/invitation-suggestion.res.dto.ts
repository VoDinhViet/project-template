import { Exclude, Expose } from 'class-transformer';
import {
  DateField,
  EnumField,
  StringField,
} from '../../../decorators/field.decorators.js';
import { InvitationStatus } from '../invitations.constant.js';

@Exclude()
export class InvitationSuggestionResDto {
  @Expose()
  @StringField({ description: 'Email từng được mời' })
  email!: string;

  @Expose()
  @EnumField(() => InvitationStatus, {
    enumName: 'InvitationStatus',
    description: 'Lời mời gần nhất của email này: EXPIRED hoặc REVOKED',
  })
  status!: InvitationStatus;

  @Expose()
  @DateField({ description: 'Thời điểm tạo lời mời gần nhất' })
  invitedAt!: Date;
}
