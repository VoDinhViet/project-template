import { registerAs } from '@nestjs/config';
import { IsString, MinLength } from 'class-validator';
import { validateConfig } from '../../../utils/validate-config.js';
import type { FirebaseConfig } from './firebase-config.type.js';

class FirebaseEnvironmentVariables {
  @IsString()
  @MinLength(1)
  FIREBASE_PROJECT_ID: string;

  @IsString()
  @MinLength(1)
  FIREBASE_CLIENT_EMAIL: string;

  @IsString()
  @MinLength(1)
  FIREBASE_PRIVATE_KEY: string;

  @IsString()
  @MinLength(1)
  FIREBASE_API_KEY: string;
}

export default registerAs<FirebaseConfig>('firebase', () => {
  const environment = validateConfig(process.env, FirebaseEnvironmentVariables);

  return {
    serviceAccount: {
      projectId: environment.FIREBASE_PROJECT_ID,
      clientEmail: environment.FIREBASE_CLIENT_EMAIL,
      // Biến môi trường một dòng nên xuống dòng của khoá PEM được ghi dưới dạng `\n` chữ.
      privateKey: environment.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    webApiKey: environment.FIREBASE_API_KEY,
  };
});
