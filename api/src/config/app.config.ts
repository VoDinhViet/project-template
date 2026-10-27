import { registerAs } from '@nestjs/config';
import { IsIn, IsInt, IsUrl, Max, Min } from 'class-validator';
import { validateConfig } from '../utils/validate-config.js';
import {
  NODE_ENVIRONMENTS,
  type AppConfig,
  type Environment,
} from './app-config.type.js';

const MAX_TCP_PORT = 65535;

class AppEnvironmentVariables {
  @IsIn(NODE_ENVIRONMENTS)
  // Mặc định `production` để thiếu biến trên hosting không vô tình bật Swagger hay nạp file `.env.local`.
  NODE_ENV: Environment = 'production';

  @IsInt()
  @Min(1)
  @Max(MAX_TCP_PORT)
  PORT: number = 4000;

  @IsUrl({ require_tld: false })
  WEB_ORIGIN: string;
}

export default registerAs<AppConfig>('app', () => {
  const environment = validateConfig(process.env, AppEnvironmentVariables);

  return {
    nodeEnv: environment.NODE_ENV,
    port: environment.PORT,
    // Bỏ dấu `/` cuối để link ghép `${webOrigin}/...` (như link trong email mời) không thành `//`.
    webOrigin: environment.WEB_ORIGIN.replace(/\/+$/, ''),
  };
});
