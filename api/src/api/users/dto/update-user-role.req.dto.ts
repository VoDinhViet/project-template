import { UUIDField } from '../../../decorators/field.decorators.js';

export class UpdateUserRoleReqDto {
  @UUIDField({ description: 'Vai trò mới' })
  roleId!: string;
}
