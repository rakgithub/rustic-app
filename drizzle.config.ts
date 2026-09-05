import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';

if (existsSync('.env')) {
  loadEnvFile('.env');
}

const databaseUrl =
  process.env['DIRECT_DATABASE_URL'] ?? process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DIRECT_DATABASE_URL or DATABASE_URL is required');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './libs/backend/database/src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
