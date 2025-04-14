/* eslint-disable no-restricted-properties */
import { env as apiEnv } from '@acme/api/env';
import { env as coreEnv } from '@acme/core/env';
import { env as dbEnv } from '@acme/db/env';
import { env as externalEnv } from '@acme/external/env';
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  extends: [coreEnv, dbEnv, apiEnv, externalEnv],
  server: {},
  shared: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === 'lint',
});
