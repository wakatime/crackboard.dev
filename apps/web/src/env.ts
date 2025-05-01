/* eslint-disable no-restricted-properties */
import { createEnv } from '@t3-oss/env-nextjs';
import { env as apiEnv } from '@workspace/api/env';
import { env as coreEnv } from '@workspace/core/env';
import { env as dbEnv } from '@workspace/db/env';
import { env as externalEnv } from '@workspace/external/env';
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
