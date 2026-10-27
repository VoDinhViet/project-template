import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AllConfigType } from '../../config/config.type.js';
import { SESSION_MAX_AGE_MS } from '../../constants/app.constant.js';
import { ErrorCode } from '../../constants/error-code.constant.js';
import { PERMISSIONS } from '../../constants/permission.constant.js';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database } from '../../database/database.type.js';
import { rolePermissions, roles, users } from '../../database/schemas/index.js';
import { AppException } from '../../exceptions/app.exception.js';
import { RefreshedSessionResDto } from './dto/refreshed-session.res.dto.js';
import { SessionResDto } from './dto/session.res.dto.js';
import { FirebaseService } from './firebase.service.js';
import type { CurrentUser } from '../../decorators/current-user.decorator.js';

// Chỉ nhận Google và email/mật khẩu, kể cả khi Console bật thêm provider khác (điện thoại, ẩn danh...).
const ALLOWED_SIGN_IN_PROVIDERS = ['google.com', 'password'];
// Firebase khuyên chỉ đổi ID token vừa đăng nhập, để token cũ bị lộ không đổi được phiên mới.
const RECENT_SIGN_IN_MAX_AGE_SECONDS = 5 * 60;
const MS_PER_SECOND = 1000;
const MAX_DISPLAY_NAME_LENGTH = 255;

/** Tên do người dùng mật khẩu tự đặt: bỏ ký tự điều khiển và cắt theo độ dài cột. */
function getDisplayName(name: string | undefined, email: string): string {
  const cleanName = (name ?? '')
    .replace(/\p{C}/gu, '')
    .trim()
    .slice(0, MAX_DISPLAY_NAME_LENGTH);
  return cleanName || email;
}

/** Chỉ nhận provider cho phép và email đã xác minh. */
function ensureAllowedSignIn(
  decodedToken: DecodedIdToken,
): asserts decodedToken is DecodedIdToken & { email: string } {
  if (
    !ALLOWED_SIGN_IN_PROVIDERS.includes(decodedToken.firebase.sign_in_provider)
  ) {
    throw new AppException(ErrorCode.E011, HttpStatus.FORBIDDEN);
  }
  if (!decodedToken.email || !decodedToken.email_verified) {
    throw new AppException(ErrorCode.E010, HttpStatus.FORBIDDEN);
  }
}

type FirebaseProfile = {
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

// `auth_time` tính bằng giây nên làm tròn mốc thu hồi xuống giây, để lần đăng nhập lại ngay trong
// giây đó không bị chặn nhầm (cùng cách firebase-admin so với `tokensValidAfterTime`).
function isSessionRevoked(
  authTimeSeconds: number,
  sessionsRevokedAt: Date | null,
): boolean {
  if (!sessionsRevokedAt) {
    return false;
  }
  return (
    authTimeSeconds < Math.floor(sessionsRevokedAt.getTime() / MS_PER_SECOND)
  );
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  /**
   * Xác minh session cookie do BFF chuyển sang, trả người dùng nội bộ kèm vai trò và quyền.
   *
   * Rules:
   * - Chưa có bản ghi hoặc phiên cấp trước `sessionsRevokedAt` → `E008` (401).
   * - Tài khoản đã xoá mềm → `E009` (403).
   */
  async verifySession(sessionCookie: string): Promise<CurrentUser> {
    const decodedCookie =
      await this.firebaseService.verifySessionCookie(sessionCookie);
    const { currentUser, sessionsRevokedAt } = await this.loadCurrentUser(
      eq(users.firebaseUid, decodedCookie.uid),
    );
    if (isSessionRevoked(decodedCookie.auth_time, sessionsRevokedAt)) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    return currentUser;
  }

  /**
   * Nạp người dùng nội bộ kèm vai trò và quyền cho `verifySession`.
   *
   * Rules:
   * - Chưa có bản ghi → `E008` (401); tài khoản đã xoá mềm → `E009` (403).
   * - Đọc vai trò và quyền từ DB mỗi request để đổi/gỡ vai trò có hiệu lực ngay.
   * - Trả kèm `sessionsRevokedAt` để người gọi tự so với mốc cấp phiên của mình.
   */
  async loadCurrentUser(
    userFilter: SQL,
  ): Promise<{ currentUser: CurrentUser; sessionsRevokedAt: Date | null }> {
    // Mỗi quyền của vai trò ra một dòng; chưa có vai trò hay vai trò không có quyền vẫn ra một dòng.
    const userGrants = await this.db
      .select({
        user: {
          id: users.id,
          firebaseUid: users.firebaseUid,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          sessionsRevokedAt: users.sessionsRevokedAt,
          deletedAt: users.deletedAt,
        },
        role: {
          id: roles.id,
          name: roles.name,
          isSystem: roles.isSystem,
        },
        permission: rolePermissions.permission,
      })
      .from(users)
      .leftJoin(roles, eq(roles.id, users.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .where(userFilter);
    const [userGrant] = userGrants;
    if (!userGrant) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    const { user, role } = userGrant;
    if (user.deletedAt) {
      throw new AppException(ErrorCode.E009, HttpStatus.FORBIDDEN);
    }

    return {
      currentUser: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role,
        permissions: role?.isSystem
          ? PERMISSIONS
          : userGrants.flatMap((grant) => grant.permission ?? []),
      },
      sessionsRevokedAt: user.sessionsRevokedAt,
    };
  }

  async createSession(idToken: string): Promise<SessionResDto> {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    const nowSeconds = Date.now() / MS_PER_SECOND;
    if (nowSeconds - decodedToken.auth_time > RECENT_SIGN_IN_MAX_AGE_SECONDS) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    ensureAllowedSignIn(decodedToken);

    await this.ensureNoPreexistingProvidersOnFirstLogin(decodedToken.uid);

    // Tên và ảnh của tài khoản mật khẩu do người dùng tự đặt qua REST, không phải Google xác nhận:
    // ảnh bỏ đi vì `avatarUrl` được tải vào trình duyệt của người khác; tên cắt theo độ dài cột.
    const isPasswordSignIn =
      decodedToken.firebase.sign_in_provider === 'password';
    await this.syncFromFirebaseProfile({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      displayName: getDisplayName(
        decodedToken.name as string | undefined,
        decodedToken.email,
      ),
      avatarUrl: isPasswordSignIn ? null : (decodedToken.picture ?? null),
    });

    const sessionCookie = await this.firebaseService.createSessionCookie(
      idToken,
      SESSION_MAX_AGE_MS,
    );
    return plainToInstance(
      SessionResDto,
      { sessionCookie, expiresInMs: SESSION_MAX_AGE_MS },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Gia hạn phiên: đổi refresh token Firebase mà BFF cất lấy ID token mới, rồi cấp session cookie
   * mới.
   *
   * Rules:
   * - Không kiểm `RECENT_SIGN_IN_MAX_AGE_SECONDS` (Firebase khuyên kiểm khi nhận ID token từ trình
   *   duyệt): ID token làm mới giữ `auth_time` gốc, và nó do chính `api` lấy từ refresh token chỉ nằm
   *   trong cookie httpOnly đã mã hoá của BFF; route này `@InternalOnly()`.
   * - Thu hồi vẫn có hiệu lực vì so `auth_time` gốc với `sessionsRevokedAt`, như `verifySession`.
   * - Không đồng bộ lại hồ sơ Firebase; việc đó chỉ làm lúc đăng nhập.
   */
  async refreshSession(refreshToken: string): Promise<RefreshedSessionResDto> {
    const refreshedTokens =
      await this.firebaseService.exchangeRefreshToken(refreshToken);
    const decodedToken = await this.firebaseService.verifyIdToken(
      refreshedTokens.idToken,
    );
    ensureAllowedSignIn(decodedToken);

    const user = await this.db.query.users.findFirst({
      where: eq(users.firebaseUid, decodedToken.uid),
      columns: { deletedAt: true, sessionsRevokedAt: true },
    });
    if (!user) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    if (user.deletedAt) {
      throw new AppException(ErrorCode.E009, HttpStatus.FORBIDDEN);
    }
    if (isSessionRevoked(decodedToken.auth_time, user.sessionsRevokedAt)) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }

    const sessionCookie = await this.firebaseService.createSessionCookie(
      refreshedTokens.idToken,
      SESSION_MAX_AGE_MS,
    );
    return plainToInstance(
      RefreshedSessionResDto,
      {
        sessionCookie,
        expiresInMs: SESSION_MAX_AGE_MS,
        refreshToken: refreshedTokens.refreshToken,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Mọi session cookie cấp trước mốc này bị `verifySession` từ chối; refresh token Firebase cũng bị
   * thu hồi để không thiết bị nào gia hạn được phiên cũ.
   */
  async signOutAllDevices(currentUser: CurrentUser): Promise<void> {
    await this.db
      .update(users)
      .set({ sessionsRevokedAt: new Date() })
      .where(eq(users.id, currentUser.id));
    await this.firebaseService.revokeRefreshTokens(currentUser.firebaseUid);
  }

  /**
   * Đồng bộ người dùng nội bộ từ hồ sơ Firebase mỗi lần đăng nhập.
   *
   * Rules:
   * - Luôn chèn trước, trùng khoá thì bỏ qua (MySQL không có `onConflictDoNothing`): lần đầu tự tạo
   *   bản ghi, hai lần đăng nhập đầu chạy song song cũng không va khoá unique.
   * - Đọc lại không thấy theo `firebaseUid` nghĩa là email đã thuộc về một tài khoản Firebase khác.
   * - Bản ghi đã xoá mềm bị từ chối, không tự khôi phục.
   */
  private async syncFromFirebaseProfile(
    profile: FirebaseProfile,
  ): Promise<void> {
    const loggedInAt = new Date();
    await this.db
      .insert(users)
      .values({ ...profile, lastLoginAt: loggedInAt })
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });

    const currentUser = await this.db.query.users.findFirst({
      where: eq(users.firebaseUid, profile.firebaseUid),
      columns: { id: true, deletedAt: true },
    });
    if (!currentUser) {
      throw new AppException(ErrorCode.E012, HttpStatus.CONFLICT);
    }
    if (currentUser.deletedAt) {
      throw new AppException(ErrorCode.E009, HttpStatus.FORBIDDEN);
    }

    await this.db
      .update(users)
      .set({
        email: profile.email,
        displayName: profile.displayName,
        // `undefined` giữ ảnh cũ: đăng nhập bằng mật khẩu không có ảnh thì không xoá ảnh Google đã lưu.
        avatarUrl: profile.avatarUrl ?? undefined,
        lastLoginAt: loggedInAt,
      })
      .where(eq(users.id, currentUser.id));

    const bootstrapOwnerEmail = this.configService.get(
      'auth.bootstrapOwnerEmail',
      { infer: true },
    );
    if (bootstrapOwnerEmail === profile.email.toLowerCase()) {
      await this.bootstrapSystemRoleUser(currentUser.id);
    }
  }

  /**
   * Lần đầu một tài khoản vào hệ thống mà Firebase đã gộp Google với provider khác thì gỡ provider khác
   * rồi buộc đăng nhập lại.
   *
   * Rules:
   * - Ai cũng đăng ký mật khẩu cho email bất kỳ được qua Firebase REST; nếu chủ email bấm link xác minh
   *   rồi đăng nhập Google, Firebase gộp hai provider và mật khẩu của kẻ đó vẫn còn. Token mật khẩu của kẻ
   *   đó cũng qua được kiểm `email_verified`, nên kiểm cho mọi lần đầu chứ không chỉ khi đăng nhập Google.
   * - Làm trước khi chèn dòng `users` để lần thử lại sau lỗi Firebase vẫn chạy lại được.
   * - Gỡ xong ném `E008`: refresh token bị thu hồi nên ID token đang cầm không dùng được nữa.
   * - Người tự tạo mật khẩu rồi lần đầu đăng nhập bằng Google cũng mất mật khẩu; "Quên mật khẩu" tạo lại được.
   */
  private async ensureNoPreexistingProvidersOnFirstLogin(
    firebaseUid: string,
  ): Promise<void> {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.firebaseUid, firebaseUid),
      columns: { id: true },
    });
    if (existingUser) {
      return;
    }
    const hasUnlinkedProviders =
      await this.firebaseService.unlinkNonGoogleProviders(firebaseUid);
    if (hasUnlinkedProviders) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Cài đặt mới chưa có ai được mời: email `BOOTSTRAP_OWNER_EMAIL` nhận vai trò hệ thống.
   *
   * Rules:
   * - Chỉ có tác dụng khi chưa ai giữ vai trò hệ thống, nên để biến này lại cũng không thành cửa sau.
   * - Khoá vai trò hệ thống (`for update`) để hai lần đăng nhập song song không cùng gán.
   */
  private async bootstrapSystemRoleUser(userId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [systemRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.isSystem, true))
        .limit(1)
        .for('update');
      if (systemRole) {
        const [systemRoleUser] = await tx
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.roleId, systemRole.id), isNull(users.deletedAt)))
          .limit(1);
        if (systemRoleUser) {
          return;
        }
      }
      const systemRoleId = systemRole?.id ?? randomUUID();
      if (!systemRole) {
        await tx.insert(roles).values({
          id: systemRoleId,
          name: 'Chủ sở hữu',
          isSystem: true,
        });
      }
      await tx
        .update(users)
        .set({ roleId: systemRoleId })
        .where(eq(users.id, userId));
    });
  }
}
