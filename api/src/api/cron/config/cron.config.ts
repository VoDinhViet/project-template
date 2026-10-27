import { registerAs } from '@nestjs/config';
import { IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { validateConfig } from '../../../utils/validate-config.js';
import type { CronConfig } from './cron-config.type.js';

class CronEnvironmentVariables {
  // `.env.example` để trống: chỉ kiểm khi có giá trị.
  @ValidateIf((environment: CronEnvironmentVariables) =>
    Boolean(environment.CRON_SECRET),
  )
  @IsString()
  // Route công khai, kẻ tấn công thử secret ở tốc độ mạng: bắt buộc đủ dài (`openssl rand -hex 32`).
  @MinLength(32)
  @Matches(/^(?!change-me)/)
  CRON_SECRET?: string;
}

export default registerAs<CronConfig>('cron', () => {
  const environment = validateConfig(process.env, CronEnvironmentVariables);
  return { secret: environment.CRON_SECRET?.trim() || undefined };
});
