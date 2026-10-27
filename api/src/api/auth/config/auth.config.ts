import { registerAs } from '@nestjs/config';
import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { validateConfig } from '../../../utils/validate-config.js';
import type { AuthConfig } from './auth-config.type.js';

const MIN_SECRET_LENGTH = 16;

class AuthEnvironmentVariables {
  @IsString()
  @MinLength(MIN_SECRET_LENGTH)
  // Chặn giá trị mẫu của `.env.example` bị sao chép nguyên sang môi trường thật.
  @Matches(/^(?!change-me)/, {
    message: 'must not be the placeholder from .env.example',
  })
  INTERNAL_API_KEY: string;

  // `.env.example` để trống dòng này: `IsOptional` không bỏ qua chuỗi rỗng nên app sẽ dừng khi boot.
  @ValidateIf((environment: AuthEnvironmentVariables) =>
    Boolean(environment.BOOTSTRAP_OWNER_EMAIL),
  )
  @IsEmail()
  BOOTSTRAP_OWNER_EMAIL?: string;
}

export default registerAs<AuthConfig>('auth', () => {
  const environment = validateConfig(process.env, AuthEnvironmentVariables);

  return {
    internalApiKey: environment.INTERNAL_API_KEY,
    bootstrapOwnerEmail:
      environment.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase() || undefined,
  };
});
