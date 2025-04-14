import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { ssl } from '../drizzle';
import { env } from '../env';
import * as schema from '../schema';

const DATABASE_URL = env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to initialize drizzle');
}

const migrationClient = postgres(DATABASE_URL, { max: 1, ssl });

const applyMigrations = async () => {
  const migrateDb = drizzle(migrationClient, { schema });
  await migrate(migrateDb, { migrationsFolder: 'drizzle' });
  await migrationClient.end();
};

await applyMigrations();
