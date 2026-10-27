import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OffsetPaginatedDto } from '../../common/dto/offset-pagination/offset-pagination.dto.js';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { ApiAuth } from '../../decorators/http.decorators.js';
import { NoRoleRequired } from '../../decorators/no-role-required.decorator.js';
import { Permissions } from '../../decorators/permissions.decorator.js';
import { UUIDParam } from '../../decorators/uuid-param.decorator.js';
import { GetUsersReqDto } from './dto/get-users.req.dto.js';
import { UpdateUserRoleReqDto } from './dto/update-user-role.req.dto.js';
import { PageUserResDto, UserResDto } from './dto/user.res.dto.js';
import { UsersService } from './users.service.js';

const USER_MUTATION_ERRORS = [
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.CONFLICT,
  HttpStatus.UNPROCESSABLE_ENTITY,
];

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @NoRoleRequired()
  @ApiAuth({
    type: UserResDto,
    summary:
      'Người dùng đang đăng nhập kèm vai trò và quyền (chưa được mời thì vai trò null)',
  })
  getCurrentUser(@CurrentUser() currentUser: CurrentUser): UserResDto {
    return this.usersService.getCurrentUser(currentUser);
  }

  @Get()
  @ApiAuth({
    type: PageUserResDto,
    isPaginated: true,
    summary:
      'Danh sách gọn người đã được mời; mọi người có vai trò đọc được để chọn người',
  })
  getUsers(
    @Query() reqDto: GetUsersReqDto,
  ): Promise<OffsetPaginatedDto<PageUserResDto>> {
    return this.usersService.getUsers(reqDto);
  }

  @Patch(':userId')
  @Permissions('users:assign_role')
  @ApiAuth({
    statusCode: HttpStatus.NO_CONTENT,
    errorResponses: USER_MUTATION_ERRORS,
    summary: 'Đổi vai trò; chỉ trao được vai trò có quyền mình đang có',
  })
  updateUserRole(
    @UUIDParam('userId') userId: string,
    @CurrentUser() currentUser: CurrentUser,
    @Body() reqDto: UpdateUserRoleReqDto,
  ): Promise<void> {
    return this.usersService.updateUserRole(userId, currentUser, reqDto);
  }

  @Delete(':userId')
  @Permissions('users:remove')
  @ApiAuth({
    statusCode: HttpStatus.NO_CONTENT,
    errorResponses: USER_MUTATION_ERRORS,
    summary: 'Gỡ quyền truy cập (bỏ vai trò, giữ tài khoản để mời lại được)',
  })
  removeUser(
    @UUIDParam('userId') userId: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<void> {
    return this.usersService.removeUser(userId, currentUser);
  }
}
