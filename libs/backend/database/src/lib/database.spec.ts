import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, getDatabase } from './database';

const originalDatabaseUrl = process.env['DATABASE_URL'];

afterEach(async () => {
  await closeDatabase();

  if (originalDatabaseUrl === undefined) {
    delete process.env['DATABASE_URL'];
  } else {
    process.env['DATABASE_URL'] = originalDatabaseUrl;
  }
});

describe('database connection', () => {
  it('creates a Drizzle database without connecting eagerly', async () => {
    const connection = createDatabase(
      'postgresql://user:password@localhost:5432/example',
    );

    expect(connection.db).toBeDefined();
    expect(connection.client).toBeDefined();
    await connection.close();
  });

  it('rejects non-PostgreSQL connection URLs', () => {
    expect(() => createDatabase('https://example.com')).toThrow(
      'DATABASE_URL must use the postgres or postgresql protocol',
    );
  });

  it('requires DATABASE_URL for the runtime connection', () => {
    delete process.env['DATABASE_URL'];

    expect(() => getDatabase()).toThrow('DATABASE_URL is required');
  });

  it('reuses the runtime connection', () => {
    process.env['DATABASE_URL'] =
      'postgresql://user:password@localhost:5432/example';

    expect(getDatabase()).toBe(getDatabase());
  });
});
