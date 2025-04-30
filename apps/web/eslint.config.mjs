import baseConfig, { restrictEnvAccess } from '@acme/eslint-config/base';
import nextjsConfig from '@acme/eslint-config/nextjs';
import reactConfig from '@acme/eslint-config/react';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.next/**', '_old-pages/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
