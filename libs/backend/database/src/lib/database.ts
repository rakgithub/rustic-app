import {
  drizzle,
  type PostgresJsDatabase,
} from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

export type DatabaseConnection = {
  client: Sql;
  db: PostgresJsDatabase;
  close: () => Promise<void>;
};

export type DatabaseConnectionOptions = {
  maxConnections?: number;
  prepare?: boolean;
};

function assertPostgresUrl(connectionString: string): void {
  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use the postgres or postgresql protocol');
  }
}

export function createDatabase(
  connectionString: string,
  options: DatabaseConnectionOptions = {},
): DatabaseConnection {
  assertPostgresUrl(connectionString);

  const client = postgres(connectionString, {
    // Vercel functions should keep their connection footprint small. The
    // Supabase transaction pooler handles pooling across function instances.
    max: options.maxConnections ?? 1,
    // Supabase transaction pooling (port 6543) does not support prepared
    // statements. This can be overridden for a direct/local connection.
    prepare: options.prepare ?? false,
  });

  return {
    client,
    db: drizzle(client),
    close: () => client.end(),
  };
}

let runtimeConnection: DatabaseConnection | undefined;

export function getDatabase(): DatabaseConnection {
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  runtimeConnection ??= createDatabase(connectionString);
  return runtimeConnection;
}

export async function closeDatabase(): Promise<void> {
  if (!runtimeConnection) return;

  const connection = runtimeConnection;
  runtimeConnection = undefined;
  await connection.close();
}
