import type { Config } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

export default {
  dbCredentials: {
    url: DATABASE_URL,
  },
  dialect: 'postgresql',
  out: 'drizzle',
  schema: 'src/schema/index.ts',
} satisfies Config;
