import type { MySql2Database } from 'drizzle-orm/mysql2';
import type * as schema from './schemas/index.js';

export type Database = MySql2Database<typeof schema>;

/** Suy ra từ callback của `transaction` để không bị lẫn với `Database`. */
export type DbTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
