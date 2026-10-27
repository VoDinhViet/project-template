import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './api/auth/auth.module.js';
import cronConfig from './api/cron/config/cron.config.js';
import mailConfig from './api/mail/config/mail.config.js';
import authConfig from './api/auth/config/auth.config.js';
import firebaseConfig from './api/auth/config/firebase.config.js';
import { FirebaseAuthGuard } from './api/auth/guards/firebase-auth.guard.js';
import { InternalKeyGuard } from './api/auth/guards/internal-key.guard.js';
import { PermissionsGuard } from './api/auth/guards/permissions.guard.js';
import {
  AppThrottlerGuard,
  readClientIp,
} from './api/auth/guards/throttler.guard.js';
import { CronModule } from './api/cron/cron.module.js';
import { HealthModule } from './api/health/health.module.js';
import { InvitationsModule } from './api/invitations/invitations.module.js';
import { UsersModule } from './api/users/users.module.js';
import { RolesModule } from './api/roles/roles.module.js';
import {
  IP_THROTTLE_LIMIT,
  USER_THROTTLE_LIMIT,
  THROTTLE_TTL_MS,
} from './constants/app.constant.js';
import appConfig from './config/app.config.js';
import databaseConfig from './database/config/database.config.js';
import { DatabaseModule } from './database/database.module.js';
import { GlobalExceptionFilter } from './filters/global-exception.filter.js';
import { ThrottlerModule } from '@nestjs/throttler';
import type { AuthenticatedRequest } from './decorators/current-user.decorator.js';
import { createValidationPipe } from './utils/validation-pipe.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        cronConfig,
        databaseConfig,
        firebaseConfig,
        mailConfig,
      ],
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'local'}`,
        '.env.local',
        '.env',
      ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'ip', ttl: THROTTLE_TTL_MS, limit: IP_THROTTLE_LIMIT },
        {
          name: 'user',
          ttl: THROTTLE_TTL_MS,
          limit: USER_THROTTLE_LIMIT,
          // Thư viện khai báo `request` là `Record<string, any>`; thực tế là request Express.
          getTracker: (request) => {
            const { user } = request as AuthenticatedRequest;
            return user?.id ?? readClientIp(request as AuthenticatedRequest);
          },
        },
      ],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    InvitationsModule,
    RolesModule,
    HealthModule,
    CronModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // Thứ tự quan trọng: khoá nội bộ, phiên người dùng, giới hạn tần suất (cần `request.user`),
    // rồi vai trò của người dùng.
    { provide: APP_GUARD, useClass: InternalKeyGuard },
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule {}
