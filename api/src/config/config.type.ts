import type { AuthConfig } from '../api/auth/config/auth-config.type.js';
import type { FirebaseConfig } from '../api/auth/config/firebase-config.type.js';
import type { MailConfig } from '../api/mail/config/mail-config.type.js';
import type { CronConfig } from '../api/cron/config/cron-config.type.js';
import type { DatabaseConfig } from '../database/config/database-config.type.js';
import type { AppConfig } from './app-config.type.js';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  cron: CronConfig;
  database: DatabaseConfig;
  firebase: FirebaseConfig;
  mail: MailConfig;
};
