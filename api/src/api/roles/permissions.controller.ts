import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../../decorators/http.decorators.js';
import { PermissionResDto } from './dto/permission.res.dto.js';
import { RolesService } from './roles.service.js';

@ApiTags('Roles')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiAuth({
    type: PermissionResDto,
    isArray: true,
    summary: 'Danh mục quyền để chọn cho vai trò',
  })
  getPermissions(): PermissionResDto[] {
    return this.rolesService.getPermissions();
  }
}
