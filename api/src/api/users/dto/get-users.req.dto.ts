import { PageOptionsDto } from '../../../common/dto/offset-pagination/page-options.dto.js';
import { UUIDFieldOptional } from '../../../decorators/field.decorators.js';

/** Chỉ người đã có vai trò, trừ admin hệ thống; `q` tìm theo tên hiển thị hoặc email. */
export class GetUsersReqDto extends PageOptionsDto {
  @UUIDFieldOptional({ description: 'Lọc theo vai trò' })
  readonly roleId?: string;
}
