/* eslint-disable no-restricted-properties */
import { createEnv } from '@t3-oss/env-nextjs';
import { env as coreEnv } from '@workspace/core/env';
import { env as dbEnv } from '@workspace/db/env';
import { z } from 'zod';

export const env = createEnv({
  extends: [coreEnv, dbEnv],
  server: {
    WAKATIME_APP_ID: z.string(),
    WAKATIME_APP_SECRET: z.string(),
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
