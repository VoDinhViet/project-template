import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { createPool, type Pool } from 'mysql2/promise';
import type { AllConfigType } from '../config/config.type.js';
import type { Database } from './database.type.js';
import * as schema from './schemas/index.js';

export const DRIZZLE = 'DRIZZLE';
const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>): Pool =>
        createPool({
          uri: configService.getOrThrow('database.url', { infer: true }),
          connectionLimit: configService.getOrThrow('database.poolMax', {
            infer: true,
          }),
          // Giờ ghi/đọc theo UTC bất kể múi giờ máy chủ MySQL (xem backend/database.md).
          timezone: 'Z',
        }),
    },
    {
      provide: DRIZZLE,
      inject: [DATABASE_POOL],
      // `planetscale` buộc relational API (`with:`) dùng subquery JSON thay vì `LEFT JOIN LATERAL`
      // mà MariaDB không hỗ trợ; MySQL 8 vẫn chạy được. Xem backend/database.md.
      useFactory: (connectionPool: Pool): Database =>
        drizzle({ client: connectionPool, schema, mode: 'planetscale' }),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly connectionPool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.connectionPool.end();
  }
}
