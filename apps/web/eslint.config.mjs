import baseConfig, { restrictEnvAccess } from '@workspace/eslint-config/base';
import nextjsConfig from '@workspace/eslint-config/nextjs';
import reactConfig from '@workspace/eslint-config/react';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.next/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
