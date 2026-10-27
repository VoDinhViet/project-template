import { registerAs } from '@nestjs/config';
import { IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { validateConfig } from '../../../utils/validate-config.js';
import type { MailConfig } from './mail-config.type.js';

// `email@miền` hoặc `Tên <email@miền>`, đúng hai dạng Resend nhận cho `from`.
const MAIL_FROM_PATTERN =
  /^([^<>@]+<[^\s<>@]+@[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+)$/;

// `.env.example` để trống hai biến này: `IsOptional` không bỏ qua chuỗi rỗng nên chỉ kiểm khi
// có giá trị, và đã điền một biến thì biến kia cũng phải hợp lệ.
const isMailConfigured = (environment: MailEnvironmentVariables): boolean =>
  Boolean(environment.RESEND_API_KEY || environment.MAIL_FROM);

// 32 byte base64 luôn là 43 ký tự cộng một dấu `=`.
const OUTBOX_KEY_PATTERN = /^[A-Za-z0-9+/]{43}=$/;

class MailEnvironmentVariables {
  @ValidateIf(isMailConfigured)
  @IsString()
  @MinLength(1)
  RESEND_API_KEY?: string;

  @ValidateIf(isMailConfigured)
  @Matches(MAIL_FROM_PATTERN)
  MAIL_FROM?: string;

  @ValidateIf((environment: MailEnvironmentVariables) =>
    Boolean(environment.MAIL_OUTBOX_KEY),
  )
  @Matches(OUTBOX_KEY_PATTERN)
  MAIL_OUTBOX_KEY?: string;
}

export default registerAs<MailConfig>('mail', () => {
  const environment = validateConfig(process.env, MailEnvironmentVariables);
  const apiKey = environment.RESEND_API_KEY?.trim();
  const from = environment.MAIL_FROM?.trim();
  const outboxKey = environment.MAIL_OUTBOX_KEY?.trim();

  return {
    resend: apiKey && from ? { apiKey, from } : undefined,
    outboxKey: outboxKey ? Buffer.from(outboxKey, 'base64') : undefined,
  };
});
