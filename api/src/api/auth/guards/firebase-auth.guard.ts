import { HttpStatus, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '../../../constants/error-code.constant.js';
import { AppException } from '../../../exceptions/app.exception.js';
import { AuthService } from '../auth.service.js';
import type { AuthenticatedRequest } from '../../../decorators/current-user.decorator.js';
import { readRouteAccess } from './route-access.js';

const BEARER_PREFIX = 'Bearer ';

/** Đọc session cookie do BFF chuyển sang; việc xác minh nằm ở `AuthService.verifySession`. */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const routeAccess = readRouteAccess(this.reflector, context);
    if (['PUBLIC', 'INTERNAL_ONLY'].includes(routeAccess)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith(BEARER_PREFIX)) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    request.user = await this.authService.verifySession(
      authorization.slice(BEARER_PREFIX.length),
    );
    return true;
  }
}
