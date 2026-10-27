import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { OffsetPaginatedDto } from '../../common/dto/offset-pagination/offset-pagination.dto.js';
import {
  CREATE_INVITATIONS_THROTTLE_LIMIT,
  CREATE_SESSION_THROTTLE_LIMIT,
  THROTTLE_TTL_MS,
} from '../../constants/app.constant.js';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { ApiAuth } from '../../decorators/http.decorators.js';
import { InternalOnly } from '../../decorators/internal-only.decorator.js';
import { NoRoleRequired } from '../../decorators/no-role-required.decorator.js';
import { Permissions } from '../../decorators/permissions.decorator.js';
import { UUIDParam } from '../../decorators/uuid-param.decorator.js';
import { CreateInvitationsReqDto } from './dto/create-invitations.req.dto.js';
import { GetInvitationSuggestionsReqDto } from './dto/get-invitation-suggestions.req.dto.js';
import { GetInvitationsReqDto } from './dto/get-invitations.req.dto.js';
import { InvitationEmailResDto } from './dto/invitation-email.res.dto.js';
import { InvitationSuggestionResDto } from './dto/invitation-suggestion.res.dto.js';
import { InvitationResultResDto } from './dto/invitation-result.res.dto.js';
import { InvitationTokenResDto } from './dto/invitation-token.res.dto.js';
import {
  InvitationResDto,
  PageInvitationResDto,
} from './dto/invitation.res.dto.js';
import { InvitationTokenParam } from './token.js';
import { InvitationsService } from './invitations.service.js';

const ACCEPT_INVITATION_ERRORS = [
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.CONFLICT,
];

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @Permissions('users:invite')
  @ApiAuth({
    type: PageInvitationResDto,
    isPaginated: true,
    summary: 'Lời mời đang chờ',
  })
  getInvitations(
    @Query() reqDto: GetInvitationsReqDto,
  ): Promise<OffsetPaginatedDto<PageInvitationResDto>> {
    return this.invitationsService.getInvitations(reqDto);
  }

  @Get('suggestions')
  @Permissions('users:invite')
  @ApiAuth({
    type: InvitationSuggestionResDto,
    isArray: true,
    summary:
      'Gợi ý email để mời lại: lời mời gần nhất đã hết hạn hoặc bị thu hồi, trừ người đã có quyền',
  })
  getInvitationSuggestions(
    @Query() reqDto: GetInvitationSuggestionsReqDto,
  ): Promise<InvitationSuggestionResDto[]> {
    return this.invitationsService.getInvitationSuggestions(reqDto);
  }

  @Post()
  @Permissions('users:invite')
  @Throttle({
    user: { ttl: THROTTLE_TTL_MS, limit: CREATE_INVITATIONS_THROTTLE_LIMIT },
  })
  @ApiAuth({
    type: InvitationResultResDto,
    isArray: true,
    summary: 'Mời theo email; trả token của link mời đúng một lần',
  })
  createInvitations(
    @CurrentUser() currentUser: CurrentUser,
    @Body() reqDto: CreateInvitationsReqDto,
  ): Promise<InvitationResultResDto[]> {
    return this.invitationsService.createInvitations(currentUser, reqDto);
  }

  @Post(':invitationId/regenerate')
  @Permissions('users:invite')
  @ApiAuth({
    type: InvitationTokenResDto,
    summary: 'Tạo link mời mới và gia hạn; link cũ hết hiệu lực',
  })
  regenerateInvitation(
    @UUIDParam('invitationId') invitationId: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<InvitationTokenResDto> {
    return this.invitationsService.regenerateInvitation(
      invitationId,
      currentUser,
    );
  }

  @Delete(':invitationId')
  @Permissions('users:invite')
  @ApiAuth({ statusCode: HttpStatus.NO_CONTENT, summary: 'Thu hồi lời mời' })
  revokeInvitation(
    @UUIDParam('invitationId') invitationId: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<void> {
    return this.invitationsService.revokeInvitation(invitationId, currentUser);
  }

  @Get(':token/email')
  @InternalOnly()
  @SkipThrottle({ user: true })
  @Throttle({
    ip: { ttl: THROTTLE_TTL_MS, limit: CREATE_SESSION_THROTTLE_LIMIT },
  })
  @ApiAuth({
    type: InvitationEmailResDto,
    summary:
      'Đọc email và trạng thái lời mời theo token khi chưa đăng nhập, để trang đăng ký biết email cố định',
  })
  getInvitationEmail(
    @InvitationTokenParam() token: string,
  ): Promise<InvitationEmailResDto> {
    return this.invitationsService.getInvitationEmail(token);
  }

  @Get(':token')
  @NoRoleRequired()
  @ApiAuth({ type: InvitationResDto, summary: 'Xem lời mời theo token' })
  getInvitation(
    @InvitationTokenParam() token: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<InvitationResDto> {
    return this.invitationsService.getInvitation(token, currentUser);
  }

  @Post(':token/accept')
  @NoRoleRequired()
  @ApiAuth({
    statusCode: HttpStatus.NO_CONTENT,
    errorResponses: ACCEPT_INVITATION_ERRORS,
    summary: 'Chấp nhận lời mời bằng tài khoản đúng email được mời',
  })
  acceptInvitation(
    @InvitationTokenParam() token: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<void> {
    return this.invitationsService.acceptInvitation(token, currentUser);
  }
}
