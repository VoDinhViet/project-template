import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SEPARATOR = '.';

/**
 * Mã hoá `plaintext` bằng AES-256-GCM; kết quả là `iv.tag.ciphertext` (base64).
 *
 * Rules:
 * - Mỗi lần mã hoá dùng IV ngẫu nhiên mới; GCM có thẻ xác thực nên sửa payload trong DB thì giải mã lỗi.
 * - `recipient` là dữ liệu xác thực kèm theo (AAD): ghi lại payload hợp lệ sang địa chỉ người nhận khác
 *   thì giải mã lỗi.
 */
export function encryptOutboxPayload(
  plaintext: string,
  recipient: string,
  key: Buffer,
): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_BYTES,
  });
  cipher.setAAD(Buffer.from(recipient));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString('base64'))
    .join(SEPARATOR);
}

/** Ném lỗi khi sai khoá, sai người nhận hoặc payload bị sửa; người gọi coi thư đó là hỏng hẳn. */
export function decryptOutboxPayload(
  payload: string,
  recipient: string,
  key: Buffer,
): string {
  const parts = payload.split(SEPARATOR);
  const [iv, tag, ciphertext] = parts.map((part) =>
    Buffer.from(part, 'base64'),
  );
  if (
    parts.length !== 3 ||
    iv.length !== IV_BYTES ||
    tag.length !== TAG_BYTES ||
    ciphertext.length === 0
  ) {
    throw new Error('Payload outbox sai định dạng');
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_BYTES,
  });
  decipher.setAAD(Buffer.from(recipient));
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
