import { PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  PERMISSIONS,
  type Permission,
} from '../../../constants/permission.constant.js';
import {
  ClassField,
  DateField,
  EnumField,
  StringField,
  UUIDField,
} from '../../../decorators/field.decorators.js';
import { RoleRefResDto } from '../../roles/dto/role.res.dto.js';

@Exclude()
export class PageUserResDto {
  @Expose()
  @UUIDField({ description: 'Mã người dùng' })
  id!: string;

  @Expose()
  @StringField({ description: 'Email đăng nhập' })
  email!: string;

  @Expose()
  @StringField({ description: 'Tên hiển thị' })
  displayName!: string;

  @Expose()
  @StringField({ description: 'Ảnh đại diện', nullable: true })
  avatarUrl!: string | null;

  @Expose()
  @ClassField(() => RoleRefResDto, { description: 'Vai trò' })
  role!: RoleRefResDto;

  @Expose()
  @DateField({ description: 'Thời điểm tạo tài khoản' })
  createdAt!: Date;
}

@Exclude()
export class UserRefResDto extends PickType(PageUserResDto, [
  'id',
  'email',
  'displayName',
  'avatarUrl',
] as const) {}

@Exclude()
export class UserResDto {
  @Expose()
  @UUIDField({ description: 'Mã người dùng' })
  id!: string;

  @Expose()
  @StringField({ description: 'Email đăng nhập' })
  email!: string;

  @Expose()
  @StringField({ description: 'Tên hiển thị' })
  displayName!: string;

  @Expose()
  @StringField({ description: 'Ảnh đại diện', nullable: true })
  avatarUrl!: string | null;

  @Expose()
  @ClassField(() => RoleRefResDto, {
    nullable: true,
    description: 'Vai trò; null khi chưa được mời vào hệ thống',
  })
  role!: RoleRefResDto | null;

  @Expose()
  @EnumField(() => PERMISSIONS, {
    enumName: 'Permission',
    each: true,
    description: 'Quyền của người dùng (rỗng khi chưa được mời)',
  })
  permissions!: Permission[];
}
