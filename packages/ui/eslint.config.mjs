import baseConfig, { restrictEnvAccess } from '@acme/eslint-config/base';
import reactConfig from '@acme/eslint-config/react';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['dist/**', 'src/components/ui/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...restrictEnvAccess,
];
