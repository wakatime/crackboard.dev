import baseConfig, { restrictEnvAccess } from '@workspace/eslint-config/base';
import reactConfig from '@workspace/eslint-config/react';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['dist/**', 'src/components/ui/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...restrictEnvAccess,
];
