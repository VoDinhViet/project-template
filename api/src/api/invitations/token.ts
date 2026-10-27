import { HttpStatus, Param } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { ErrorCode } from '../../constants/error-code.constant.js';
import { AppException } from '../../exceptions/app.exception.js';

const TOKEN_BYTES = 32;
// `randomBytes(32)` mã hoá base64url luôn ra 43 ký tự; chuỗi khác không cần tra DB.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Token sai định dạng trả 404 `E016` như link không tồn tại (không phải 422), giống `UUIDParam`.
 */
export const InvitationTokenParam = () =>
  Param('token', {
    transform: (token: string): string => {
      if (!TOKEN_PATTERN.test(token)) {
        throw new AppException(ErrorCode.E016, HttpStatus.NOT_FOUND);
      }
      return token;
    },
  });

/** Token gốc chỉ trả về một lần cho người mời; DB chỉ giữ hash. */
export function generateInvitationToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashInvitationToken(token) };
}
