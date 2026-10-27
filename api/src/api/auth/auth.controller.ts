import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import {
  CREATE_SESSION_THROTTLE_LIMIT,
  THROTTLE_TTL_MS,
} from '../../constants/app.constant.js';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { ApiAuth } from '../../decorators/http.decorators.js';
import { InternalOnly } from '../../decorators/internal-only.decorator.js';
import { NoRoleRequired } from '../../decorators/no-role-required.decorator.js';
import { AuthService } from './auth.service.js';
import { CreateSessionReqDto } from './dto/create-session.req.dto.js';
import { RefreshSessionReqDto } from './dto/refresh-session.req.dto.js';
import { RefreshedSessionResDto } from './dto/refreshed-session.res.dto.js';
import { SessionResDto } from './dto/session.res.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('session')
  @InternalOnly()
  @SkipThrottle({ user: true })
  @Throttle({
    ip: { ttl: THROTTLE_TTL_MS, limit: CREATE_SESSION_THROTTLE_LIMIT },
  })
  @ApiAuth({
    type: SessionResDto,
    summary: 'Đổi Firebase ID token lấy session cookie',
  })
  createSession(@Body() reqDto: CreateSessionReqDto): Promise<SessionResDto> {
    return this.authService.createSession(reqDto.idToken);
  }

  @Post('session/refresh')
  @InternalOnly()
  @SkipThrottle({ user: true })
  @Throttle({
    ip: { ttl: THROTTLE_TTL_MS, limit: CREATE_SESSION_THROTTLE_LIMIT },
  })
  @ApiAuth({
    type: RefreshedSessionResDto,
    summary: 'Đổi refresh token Firebase lấy session cookie mới',
  })
  refreshSession(
    @Body() reqDto: RefreshSessionReqDto,
  ): Promise<RefreshedSessionResDto> {
    return this.authService.refreshSession(reqDto.refreshToken);
  }

  @Post('logout-all')
  @NoRoleRequired()
  @ApiAuth({
    statusCode: HttpStatus.NO_CONTENT,
    summary: 'Đăng xuất khỏi mọi thiết bị',
  })
  signOutAllDevices(@CurrentUser() currentUser: CurrentUser): Promise<void> {
    return this.authService.signOutAllDevices(currentUser);
  }
}
