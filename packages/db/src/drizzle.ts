import type { Logger } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from './env';
import * as schema from './schema';

export * from 'drizzle-orm';
export { alias, union, unionAll } from 'drizzle-orm/pg-core';

const DATABASE_URL = env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to initialize drizzle');
}

export type DB = PostgresJsDatabase<typeof schema>;

export const ssl = env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined;

const client = postgres(DATABASE_URL, { ssl });

const globalForDb = globalThis as unknown as {
  db: DB | undefined;
};

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ params, query });
  }
}

export const db = globalForDb.db ?? drizzle(client, { logger: env.LOG_SQL ? new MyLogger() : false, schema });

if (env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
