/* eslint-disable no-restricted-properties */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    JWT_SECRET: z.string().min(1),
    ADMIN_IDS: z.string().optional(),
    SPACES_KEY: z.string().optional(),
    SPACES_SECRET: z.string().optional(),

    INTEGRATION_GITHUB_SECRET: z.string().optional(),
    INTEGRATION_GITHUB_CLIENT_ID: z.string().optional(),
    INTEGRATION_GITHUB_APP_ID: z.string().optional(),
    INTEGRATION_GITHUB_SECRET_KEY: z.string().optional(),

    INTEGRATION_STACK_EXCHANGE_SECRET: z.string().optional(),
    INTEGRATION_STACK_EXCHANGE_CLIENT_ID: z.string().optional(),
    INTEGRATION_STACK_EXCHANGE_SECRET_REQUEST_KEY: z.string().optional(),

    INTEGRATION_GITLAB_SECRET: z.string().optional(),
    INTEGRATION_GITLAB_CLIENT_ID: z.string().optional(),

    INTEGRATION_LINKEDIN_SECRET: z.string().optional(),
    INTEGRATION_LINKEDIN_CLIENT_ID: z.string().optional(),

    INTEGRATION_TWITCH_SECRET: z.string().optional(),
    INTEGRATION_TWITCH_CLIENT_ID: z.string().optional(),

    INTEGRATION_PRODUCT_HUNT_SECRET: z.string().optional(),
    INTEGRATION_PRODUCT_HUNT_CLIENT_ID: z.string().optional(),

    INTEGRATION_YOUTUBE_SECRET: z.string().optional(),
    INTEGRATION_YOUTUBE_CLIENT_ID: z.string().optional(),

    INTEGRATION_UNSPLASH_SECRET: z.string().optional(),
    INTEGRATION_UNSPLASH_CLIENT_ID: z.string().optional(),

    INTEGRATION_INSTAGRAM_SECRET: z.string().optional(),
    INTEGRATION_INSTAGRAM_CLIENT_ID: z.string().optional(),

    INTEGRATION_TIKTOK_SECRET: z.string().optional(),
    INTEGRATION_TIKTOK_CLIENT_ID: z.string().optional(),

    INTEGRATION_WIKIPEDIA_SECRET: z.string().optional(),
    INTEGRATION_WIKIPEDIA_CLIENT_ID: z.string().optional(),

    DISPOSABLE_EMAIL_KEY: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().optional(),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
