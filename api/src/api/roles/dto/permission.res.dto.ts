import { Exclude, Expose } from 'class-transformer';
import {
  PERMISSIONS,
  type Permission,
} from '../../../constants/permission.constant.js';
import {
  EnumField,
  StringField,
} from '../../../decorators/field.decorators.js';

@Exclude()
export class PermissionResDto {
  @Expose()
  @EnumField(() => PERMISSIONS, {
    enumName: 'Permission',
    description: 'Mã quyền',
  })
  code!: Permission;

  @Expose()
  @StringField({ description: 'Tên nhóm quyền' })
  groupName!: string;

  @Expose()
  @StringField({ description: 'Tên quyền' })
  name!: string;

  @Expose()
  @StringField({ description: 'Mô tả quyền' })
  description!: string;
}
