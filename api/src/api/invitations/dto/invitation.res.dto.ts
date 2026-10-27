import { Exclude, Expose } from 'class-transformer';
import {
  BooleanField,
  ClassField,
  DateField,
  EnumField,
  StringField,
  UUIDField,
} from '../../../decorators/field.decorators.js';
import { RoleRefResDto } from '../../roles/dto/role.res.dto.js';
import { InvitationStatus } from '../invitations.constant.js';

@Exclude()
export class PageInvitationResDto {
  @Expose()
  @UUIDField({ description: 'Mã lời mời' })
  id!: string;

  @Expose()
  @StringField({ description: 'Email được mời' })
  email!: string;

  @Expose()
  @ClassField(() => RoleRefResDto, { description: 'Vai trò sau khi chấp nhận' })
  role!: RoleRefResDto;

  @Expose()
  @StringField({ description: 'Tên người mời', nullable: true })
  invitedByName!: string | null;

  @Expose()
  @DateField({ description: 'Hạn của link mời hiện tại' })
  expiresAt!: Date;

  @Expose()
  @DateField({ description: 'Thời điểm tạo lời mời' })
  createdAt!: Date;
}

@Exclude()
export class InvitationResDto {
  @Expose()
  @StringField({ description: 'Email được mời' })
  email!: string;

  @Expose()
  @ClassField(() => RoleRefResDto, { description: 'Vai trò sau khi chấp nhận' })
  role!: RoleRefResDto;

  @Expose()
  @StringField({ description: 'Tên người mời', nullable: true })
  invitedByName!: string | null;

  @Expose()
  @DateField({ description: 'Hạn của link mời' })
  expiresAt!: Date;

  @Expose()
  @EnumField(() => InvitationStatus, {
    enumName: 'InvitationStatus',
    description: 'Trạng thái lời mời',
  })
  status!: InvitationStatus;

  @Expose()
  @BooleanField({
    description: 'Email đang đăng nhập có trùng email được mời không',
  })
  isEmailMatched!: boolean;

  @Expose()
  @BooleanField({
    description: 'Người dùng hiện tại đã có vai trò trong hệ thống chưa',
  })
  hasAccess!: boolean;
}
