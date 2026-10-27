import { PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  PERMISSIONS,
  type Permission,
} from '../../../constants/permission.constant.js';
import {
  BooleanField,
  EnumField,
  NumberField,
  StringField,
  UUIDField,
} from '../../../decorators/field.decorators.js';

@Exclude()
export class RoleResDto {
  @Expose()
  @UUIDField({ description: 'Mã vai trò' })
  id!: string;

  @Expose()
  @StringField({ description: 'Tên vai trò' })
  name!: string;

  @Expose()
  @StringField({ description: 'Mô tả vai trò', nullable: true })
  description!: string | null;

  @Expose()
  @BooleanField({
    description:
      'Vai trò hệ thống: luôn đủ mọi quyền, không đổi quyền, không xoá được',
  })
  isSystem!: boolean;

  @Expose()
  @BooleanField({
    description: 'Vai trò mặc định, tối đa một vai trò',
  })
  isDefault!: boolean;

  @Expose()
  @EnumField(() => PERMISSIONS, {
    enumName: 'Permission',
    each: true,
    description: 'Mã quyền của vai trò',
  })
  permissions!: Permission[];

  @Expose()
  @NumberField({ int: true, description: 'Số người đang giữ vai trò' })
  userCount!: number;
}

@Exclude()
export class RoleRefResDto extends PickType(RoleResDto, [
  'id',
  'name',
  'isSystem',
] as const) {}
