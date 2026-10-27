import { registerAs } from '@nestjs/config';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { validateConfig } from '../../utils/validate-config.js';
import type { DatabaseConfig } from './database-config.type.js';

const MAX_POOL_SIZE = 50;

class DatabaseEnvironmentVariables {
  @IsString()
  @MinLength(1)
  DATABASE_URL: string;

  // Shared hosting giới hạn số kết nối MySQL mỗi tài khoản, nên mặc định nhỏ.
  @IsInt()
  @Min(1)
  @Max(MAX_POOL_SIZE)
  DATABASE_POOL_MAX: number = 5;
}

export default registerAs<DatabaseConfig>('database', () => {
  const environment = validateConfig(process.env, DatabaseEnvironmentVariables);

  return {
    url: environment.DATABASE_URL,
    poolMax: environment.DATABASE_POOL_MAX,
  };
});
