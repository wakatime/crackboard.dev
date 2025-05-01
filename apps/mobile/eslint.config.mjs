import baseConfig from '@workspace/eslint-config/base';
import reactConfig from '@workspace/eslint-config/react';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.expo/**', 'expo-plugins/**'],
  },
  ...baseConfig,
  ...reactConfig,
];
