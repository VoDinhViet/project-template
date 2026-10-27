import {
  PERMISSIONS,
  type Permission,
} from '../../../constants/permission.constant.js';
import {
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.js';

export class CreateRoleReqDto {
  @StringField({
    maxLength: 100,
    description: 'Tên vai trò, không trùng',
  })
  name!: string;

  @StringFieldOptional({ maxLength: 255, description: 'Mô tả vai trò' })
  description?: string;

  @EnumField(() => PERMISSIONS, {
    enumName: 'Permission',
    each: true,
    description: 'Mã quyền của vai trò; chỉ chọn được quyền mình đang có',
  })
  permissions!: Permission[];
}
