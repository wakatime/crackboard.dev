/* eslint-disable no-restricted-properties */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    LOG_SQL: z.string().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_PORT: z.string().optional(),
    REDIS_USERNAME: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  client: {},
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
