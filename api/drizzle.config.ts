import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit không nạp .env của Nest, nên tự nạp đúng file theo NODE_ENV (Node có sẵn loadEnvFile).
const environmentFile = `.env.${process.env.NODE_ENV || 'local'}`;
if (existsSync(environmentFile)) {
  process.loadEnvFile(environmentFile);
}

export default defineConfig({
  dialect: 'mysql',
  schema: './src/database/schemas/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
