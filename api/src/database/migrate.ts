import { drizzle } from 'drizzle-orm/mysql2';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { createConnection } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';

/**
 * Áp migration của `drizzle/` lên DB trong `DATABASE_URL`; chỉ pipeline deploy gọi trên hosting
 * (`node --env-file=... dist/database/migrate.js check|apply`), không có `drizzle-kit` ở đó.
 *
 * Rules:
 * - `check` in số migration chưa áp để script deploy quyết định có dump DB trước hay không.
 * - Đếm theo đúng luật của migrator: migration có `folderMillis` lớn hơn `created_at` mới nhất là chưa áp.
 * - Dùng chung bảng `__drizzle_migrations` với `drizzle-kit migrate` nên hai cách chạy thay nhau được.
 */

const MIGRATIONS_FOLDER = 'drizzle';

async function countPendingMigrations(databaseUrl: string): Promise<number> {
  const migrations = readMigrationFiles({
    migrationsFolder: MIGRATIONS_FOLDER,
  });
  const connection = await createConnection(databaseUrl);
  try {
    const [migrationTables] = await connection.query<RowDataPacket[]>(
      "SHOW TABLES LIKE '__drizzle_migrations'",
    );
    if (migrationTables.length === 0) {
      return migrations.length;
    }
    const [[lastMigration]] = await connection.query<RowDataPacket[]>(
      'SELECT MAX(created_at) AS createdAt FROM __drizzle_migrations',
    );
    const lastAppliedMillis = Number(lastMigration?.createdAt ?? 0);
    return migrations.filter(
      (migration) => migration.folderMillis > lastAppliedMillis,
    ).length;
  } finally {
    await connection.end();
  }
}

async function applyMigrations(databaseUrl: string): Promise<void> {
  // Một kết nối, không pool: DDL của MySQL không nằm trong transaction nên chạy tuần tự là đủ.
  const connection = await createConnection(databaseUrl);
  try {
    await migrate(drizzle({ client: connection }), {
      migrationsFolder: MIGRATIONS_FOLDER,
    });
  } finally {
    await connection.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  const command = process.argv[2];
  if (command === 'check') {
    process.stdout.write(`${await countPendingMigrations(databaseUrl)}\n`);
    return;
  }
  if (command === 'apply') {
    await applyMigrations(databaseUrl);
    process.stdout.write('Migrations applied\n');
    return;
  }
  throw new Error('Usage: migrate.js check|apply');
}

await main();
