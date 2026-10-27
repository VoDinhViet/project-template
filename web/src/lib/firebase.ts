import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import type { Auth, User } from 'firebase/auth'
import { clientEnv } from './env'

// Cấu hình web của Firebase là công khai nên được đặt sau tiền tố `VITE_`.
// Chỉ import file này trong code chạy ở trình duyệt (dùng `import()` động).
const firebaseConfig = {
  apiKey: clientEnv.VITE_FIREBASE_API_KEY,
  authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.VITE_FIREBASE_PROJECT_ID,
  appId: clientEnv.VITE_FIREBASE_APP_ID,
}

/**
 * Phiên thật là cookie httpOnly ở BFF (cất cả refresh token để gia hạn), nên không để token Firebase
 * nằm trong IndexedDB.
 *
 * Rules:
 * - `initializeAuth` chỉ gọi được một lần mỗi app; app luôn được tạo cùng auth ở đây, nên app đã
 *   có (kể cả sau HMR) thì `getAuth` trả lại đúng auth dùng bộ nhớ trong.
 */
function getFirebaseAuth(): Auth {
  if (getApps().length > 0) {
    return getAuth(getApp())
  }
  return initializeAuth(initializeApp(firebaseConfig), {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  })
}

export type FirebaseTokens = {
  idToken: string
  refreshToken: string
}

/**
 * Token để BFF đổi lấy phiên rồi cất refresh token.
 *
 * Rules:
 * - `signOut` ngay sau đó chỉ xoá trạng thái trong bộ nhớ, không thu hồi refresh token đã lấy.
 * - Gọi `getIdToken()` trước (đúng thứ tự khoá) để `refreshToken` đọc ra là giá trị mới nhất.
 */
async function readFirebaseTokens(user: User): Promise<FirebaseTokens> {
  return { idToken: await user.getIdToken(), refreshToken: user.refreshToken }
}

/** Mở popup Google và trả token Firebase để đổi lấy session cookie. */
export async function signInWithGoogle(): Promise<FirebaseTokens> {
  const auth = getFirebaseAuth()
  const googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(auth, googleProvider)
  try {
    return await readFirebaseTokens(credential.user)
  } finally {
    await signOut(auth)
  }
}

/** Mã lỗi tự đặt, cùng dạng với lỗi Firebase để `resolveAuthErrorMessage` dịch chung. */
export const EMAIL_NOT_VERIFIED_CODE = 'auth/email-not-verified'

/**
 * Đăng nhập bằng email/mật khẩu và trả token Firebase để đổi lấy session cookie.
 *
 * Rules:
 * - Email chưa xác minh thì không lấy token (`api` cũng từ chối bằng `E010`), ném lỗi `EMAIL_NOT_VERIFIED_CODE`.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<FirebaseTokens> {
  const auth = getFirebaseAuth()
  const credential = await signInWithEmailAndPassword(auth, email, password)
  try {
    if (!credential.user.emailVerified) {
      throw Object.assign(new Error('Email chưa được xác minh.'), {
        code: EMAIL_NOT_VERIFIED_CODE,
      })
    }
    return await readFirebaseTokens(credential.user)
  } finally {
    await signOut(auth)
  }
}

type RegisterWithPasswordInput = {
  email: string
  password: string
  displayName: string
  continueUrl: string
}

/** Tạo tài khoản mật khẩu, đặt họ tên và gửi email xác minh; không đăng nhập (chưa xác minh thì `api` không nhận). */
export async function registerWithPassword({
  email,
  password,
  displayName,
  continueUrl,
}: RegisterWithPasswordInput): Promise<void> {
  const auth = getFirebaseAuth()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  try {
    await updateProfile(credential.user, { displayName })
    await sendEmailVerification(credential.user, { url: continueUrl })
  } finally {
    await signOut(auth)
  }
}

/** Gửi lại email xác minh: Firebase chỉ gửi cho người đang đăng nhập nên phải đăng nhập lại bằng đúng mật khẩu. */
export async function resendVerificationEmail(
  email: string,
  password: string,
  continueUrl: string,
): Promise<void> {
  const auth = getFirebaseAuth()
  const credential = await signInWithEmailAndPassword(auth, email, password)
  try {
    await sendEmailVerification(credential.user, { url: continueUrl })
  } finally {
    await signOut(auth)
  }
}

/** Gửi email đặt lại mật khẩu; Firebase không báo email có tồn tại hay không. */
export async function sendResetPasswordEmail(
  email: string,
  continueUrl: string,
): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email, { url: continueUrl })
}
