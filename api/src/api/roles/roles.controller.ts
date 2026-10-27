import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { Permissions } from '../../decorators/permissions.decorator.js';
import { ApiAuth } from '../../decorators/http.decorators.js';
import { UUIDParam } from '../../decorators/uuid-param.decorator.js';
import { CreateRoleReqDto } from './dto/create-role.req.dto.js';
import { RoleResDto } from './dto/role.res.dto.js';
import { UpdateRoleReqDto } from './dto/update-role.req.dto.js';
import { RolesService } from './roles.service.js';

const ROLE_MUTATION_ERRORS = [
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.CONFLICT,
  HttpStatus.UNPROCESSABLE_ENTITY,
];

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles:read')
  @ApiAuth({
    type: RoleResDto,
    isArray: true,
    summary:
      'Vai trò kèm quyền và số người đang giữ (cần khi mời, đổi vai trò, lọc thành viên)',
  })
  getRoles(): Promise<RoleResDto[]> {
    return this.rolesService.getRoles();
  }

  @Post()
  @Permissions('roles:create')
  @ApiAuth({
    statusCode: HttpStatus.NO_CONTENT,
    errorResponses: ROLE_MUTATION_ERRORS,
    summary: 'Tạo vai trò; chỉ chọn được quyền mình đang có',
  })
  createRole(
    @CurrentUser() currentUser: CurrentUser,
    @Body() reqDto: CreateRoleReqDto,
  ): Promise<void> {
    return this.rolesService.createRole(currentUser, reqDto);
  }

  @Patch(':roleId')
  @Permissions('roles:update')
  @ApiAuth({
    statusCode: HttpStatus.NO_CONTENT,
    errorResponses: ROLE_MUTATION_ERRORS,
    summary: 'Sửa vai trò; vai trò hệ thống không sửa được',
  })
  updateRole(
    @UUIDParam('roleId') roleId: string,
    @CurrentUser() currentUser: CurrentUser,
    @Body() reqDto: UpdateRoleReqDto,
  ): Promise<void> {
    return this.rolesService.updateRole(roleId, currentUser, reqDto);
  }

  @Delete(':roleId')
  @Permissions('roles:delete')
  @ApiAuth({
    statusCode: HttpStatus.NO_CONTENT,
    errorResponses: ROLE_MUTATION_ERRORS,
    summary: 'Xoá vai trò không còn ai giữ và không còn lời mời chờ',
  })
  deleteRole(
    @UUIDParam('roleId') roleId: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<void> {
    return this.rolesService.deleteRole(roleId, currentUser);
  }
}
