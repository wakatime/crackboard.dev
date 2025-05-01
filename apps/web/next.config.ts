/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

import { fileURLToPath } from 'url';
import createJiti from 'jiti';
import { NextConfig } from 'next';

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))('./src/env');

const config: NextConfig = {
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@workspace/api', '@workspace/db', '@workspace/tasks', '@workspace/core', '@workspace/ui', '@workspace/external'],

  // Not supported in app router
  // i18n: {
  //   defaultLocale: 'en',
  //   locales: ['en'],
  // },

  images: {
    remotePatterns: [{ hostname: 'wakatime.com', protocol: 'https' }],
  },
};

export default config;
