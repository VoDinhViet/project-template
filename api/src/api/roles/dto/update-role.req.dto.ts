import {
  PERMISSIONS,
  type Permission,
} from '../../../constants/permission.constant.js';
import {
  BooleanFieldOptional,
  EnumFieldOptional,
  StringFieldOptional,
} from '../../../decorators/field.decorators.js';

export class UpdateRoleReqDto {
  @StringFieldOptional({
    maxLength: 100,
    description: 'Tên vai trò, không trùng',
  })
  name?: string;

  @StringFieldOptional({
    maxLength: 255,
    nullable: true,
    description: 'Mô tả vai trò; null để xoá mô tả',
  })
  description?: string | null;

  @EnumFieldOptional(() => PERMISSIONS, {
    enumName: 'Permission',
    each: true,
    description:
      'Thay toàn bộ quyền của vai trò; không áp dụng cho vai trò hệ thống',
  })
  permissions?: Permission[];

  @BooleanFieldOptional({
    description:
      'true: đặt làm vai trò mặc định (bỏ cờ của vai trò mặc định cũ); false: bỏ cờ',
  })
  isDefault?: boolean;
}
