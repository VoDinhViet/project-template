import {
  HttpStatus,
  Injectable,
  Logger,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, deleteApp, initializeApp, type App } from 'firebase-admin/app';
import {
  FirebaseAuthError,
  getAuth,
  type Auth,
  type DecodedIdToken,
} from 'firebase-admin/auth';
import type { AllConfigType } from '../../config/config.type.js';
import { ErrorCode } from '../../constants/error-code.constant.js';
import { AppException } from '../../exceptions/app.exception.js';

const FIREBASE_APP_NAME = 'qlda';
// Chỉ các mã liên quan tới chính token mới là 401. Mã khác (thiếu quyền IAM, quota, mạng...) là lỗi
// cấu hình hoặc hạ tầng, phải ra 500 và được log thay vì làm mọi người dùng bị đăng xuất âm thầm.
const TOKEN_REJECTION_CODES = new Set([
  'auth/argument-error',
  'auth/invalid-id-token',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/user-not-found',
]);
const USER_DISABLED_CODE = 'auth/user-disabled';
const GOOGLE_PROVIDER_ID = 'google.com';
const SECURE_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';
const SECURE_TOKEN_TIMEOUT_MS = 10_000;
// Mã lỗi của Secure Token API nghĩa là refresh token không còn dùng được (hết hạn, bị thu hồi, sai).
const REFRESH_TOKEN_REJECTION_MESSAGES = new Set([
  'TOKEN_EXPIRED',
  'INVALID_REFRESH_TOKEN',
  'MISSING_REFRESH_TOKEN',
  'USER_NOT_FOUND',
]);
const REFRESH_USER_DISABLED_MESSAGE = 'USER_DISABLED';

type SecureTokenResponse = {
  id_token?: string;
  refresh_token?: string;
  error?: { message?: string };
};

type RefreshedFirebaseTokens = {
  idToken: string;
  refreshToken: string;
};

/** Bọc `firebase-admin`: token bị từ chối thành `E008` (401), tài khoản bị khoá thành `E009`. */
@Injectable()
export class FirebaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App | undefined;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return this.guardTokenErrors(() =>
      this.getFirebaseAuth().verifyIdToken(idToken, true),
    );
  }

  createSessionCookie(idToken: string, expiresInMs: number): Promise<string> {
    return this.guardTokenErrors(() =>
      this.getFirebaseAuth().createSessionCookie(idToken, {
        expiresIn: expiresInMs,
      }),
    );
  }

  // Tắt `checkRevoked` vì nó gọi mạng tới Google ở mọi request; thu hồi phiên kiểm bằng
  // `users.sessionsRevokedAt` trong `FirebaseAuthGuard`.
  verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken> {
    return this.guardTokenErrors(() =>
      this.getFirebaseAuth().verifySessionCookie(sessionCookie, false),
    );
  }

  /**
   * Đổi refresh token Firebase lấy ID token mới qua Secure Token API; `firebase-admin` không có hàm này.
   *
   * Rules:
   * - Google có thể trả refresh token mới, nên trả cả hai để nơi gọi lưu lại cái mới.
   * - Refresh token hỏng, hết hạn hay bị thu hồi → `E008`; tài khoản bị khoá → `E009`.
   * - Lỗi khác chỉ log mã lỗi của Google, không log token.
   */
  async exchangeRefreshToken(
    refreshToken: string,
  ): Promise<RefreshedFirebaseTokens> {
    const webApiKey = this.configService.getOrThrow('firebase.webApiKey', {
      infer: true,
    });
    const response = await fetch(
      `${SECURE_TOKEN_URL}?key=${encodeURIComponent(webApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        signal: AbortSignal.timeout(SECURE_TOKEN_TIMEOUT_MS),
      },
    );
    // Lỗi hạ tầng của Google có thể trả HTML; khi đó coi như không có mã lỗi để rơi xuống nhánh log.
    const secureToken = (await response
      .json()
      .catch(() => ({}))) as SecureTokenResponse;
    if (response.ok && secureToken.id_token && secureToken.refresh_token) {
      return {
        idToken: secureToken.id_token,
        refreshToken: secureToken.refresh_token,
      };
    }
    // Google có thể nối thêm chi tiết sau mã lỗi (`TOKEN_EXPIRED : ...`).
    const errorMessage = secureToken.error?.message?.split(' ')[0] ?? '';
    if (REFRESH_TOKEN_REJECTION_MESSAGES.has(errorMessage)) {
      throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
    }
    if (errorMessage === REFRESH_USER_DISABLED_MESSAGE) {
      throw new AppException(ErrorCode.E009, HttpStatus.FORBIDDEN);
    }
    this.logger.error(
      `Secure Token API rejected the request: ${response.status} ${errorMessage}`,
    );
    throw new Error('Secure Token API request failed');
  }

  revokeRefreshTokens(firebaseUid: string): Promise<void> {
    return this.guardTokenErrors(() =>
      this.getFirebaseAuth().revokeRefreshTokens(firebaseUid),
    );
  }

  /**
   * Nếu tài khoản đã gắn Google cùng provider khác (mật khẩu...) thì gỡ provider khác và thu hồi refresh
   * token; trả `true` khi đã gỡ.
   *
   * Rules:
   * - Chỉ gọi lần đầu một tài khoản vào hệ thống, xem `AuthService.createSession`.
   * - Thu hồi refresh token để token mật khẩu mà kẻ cài sẵn mật khẩu đã giữ không đổi lấy ID token mới;
   *   hệ quả là ID token đang cầm cũng bị `verifyIdToken` từ chối, người dùng phải đăng nhập lại một lần.
   */
  unlinkNonGoogleProviders(firebaseUid: string): Promise<boolean> {
    return this.guardTokenErrors(async () => {
      const auth = this.getFirebaseAuth();
      const { providerData } = await auth.getUser(firebaseUid);
      const providerIds = providerData.map((provider) => provider.providerId);
      const otherProviderIds = providerIds.filter(
        (providerId) => providerId !== GOOGLE_PROVIDER_ID,
      );
      if (
        !providerIds.includes(GOOGLE_PROVIDER_ID) ||
        otherProviderIds.length === 0
      ) {
        return false;
      }
      await auth.updateUser(firebaseUid, {
        providersToUnlink: otherProviderIds,
      });
      await auth.revokeRefreshTokens(firebaseUid);
      return true;
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.app) {
      await deleteApp(this.app);
    }
  }

  // Khởi tạo lười để script xuất OpenAPI và việc boot không cần khoá thật.
  private getFirebaseAuth(): Auth {
    this.app ??= initializeApp(
      {
        credential: cert(
          this.configService.getOrThrow('firebase.serviceAccount', {
            infer: true,
          }),
        ),
      },
      FIREBASE_APP_NAME,
    );
    return getAuth(this.app);
  }

  private async guardTokenErrors<TResult>(
    action: () => Promise<TResult>,
  ): Promise<TResult> {
    try {
      return await action();
    } catch (error: unknown) {
      if (!(error instanceof FirebaseAuthError)) {
        throw error;
      }
      if (TOKEN_REJECTION_CODES.has(error.code)) {
        throw new AppException(ErrorCode.E008, HttpStatus.UNAUTHORIZED);
      }
      if (error.code === USER_DISABLED_CODE) {
        throw new AppException(ErrorCode.E009, HttpStatus.FORBIDDEN);
      }
      this.logger.error(`Firebase rejected the request: ${error.code}`);
      throw error;
    }
  }
}
