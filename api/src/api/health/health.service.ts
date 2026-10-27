import { Inject, Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database } from '../../database/database.type.js';
import { DatabaseStatus, HealthResDto } from './dto/health.res.dto.js';

// `/health` công khai và không có rate limit, nên dùng lại kết quả ping vài giây (kể cả `DOWN`).
const DATABASE_STATUS_CACHE_MS = 5000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private cachedDatabaseStatus:
    { status: DatabaseStatus; expiresAt: number } | undefined;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getHealth(): Promise<HealthResDto> {
    return plainToInstance(
      HealthResDto,
      { db: await this.pingDatabase() },
      { excludeExtraneousValues: true },
    );
  }

  private async pingDatabase(): Promise<DatabaseStatus> {
    if (
      this.cachedDatabaseStatus &&
      this.cachedDatabaseStatus.expiresAt > Date.now()
    ) {
      return this.cachedDatabaseStatus.status;
    }
    let status = DatabaseStatus.UP;
    try {
      await this.db.execute(sql`select 1`);
    } catch (error: unknown) {
      this.logger.warn(
        `Database ping failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      status = DatabaseStatus.DOWN;
    }
    this.cachedDatabaseStatus = {
      status,
      expiresAt: Date.now() + DATABASE_STATUS_CACHE_MS,
    };
    return status;
  }
}
