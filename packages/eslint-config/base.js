/// <reference types="./types.d.ts" />

import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

/**
 * All packages that leverage t3-env should use this rule
 */
export const restrictEnvAccess = tseslint.config({
  files: ['**/*.js', '**/*.ts', '**/*.tsx'],
  rules: {
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message: "Use `import { env } from '~/env'` instead to ensure validated types.",
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        name: 'process',
        importNames: ['env'],
        message: "Use `import { env } from '~/env'` instead to ensure validated types.",
      },
    ],
  },
});

export default tseslint.config(
  {
    // Globally ignored files
    ignores: ['**/*.config.*'],
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
      '@typescript-eslint/no-misused-promises': [2, { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        {
          allowConstantLoopConditions: true,
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: { parserOptions: { project: true } },
  },
);

// const config = {
//   extends: [
//     // 'plugin:jsx-a11y/recommended',
//     'eslint:recommended',
//     'plugin:@typescript-eslint/recommended-type-checked',
//     'plugin:@typescript-eslint/stylistic-type-checked',
//     'prettier',
//   ],
//   parser: '@typescript-eslint/parser',
//   parserOptions: {
//     project: true,
//   },
//   plugins: ['@typescript-eslint', 'import', 'prettier', 'sort-keys-fix', 'typescript-sort-keys'],
//   rules: {
//     '@typescript-eslint/array-type': 'off',
//     '@typescript-eslint/consistent-type-definitions': 'off',
//     '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'separate-type-imports', prefer: 'type-imports' }],
//     '@typescript-eslint/no-misused-promises': [2, { checksVoidReturn: { attributes: false } }],
//     '@typescript-eslint/no-require-imports': 'error',
//     '@typescript-eslint/no-unnecessary-condition': 'warn',
//     '@typescript-eslint/no-unsafe-enum-comparison': 'error',
//     '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
//     '@typescript-eslint/prefer-enum-initializers': 'error',
//     '@typescript-eslint/prefer-for-of': 'error',
//     '@typescript-eslint/prefer-optional-chain': 'error',
//     '@typescript-eslint/prefer-reduce-type-parameter': 'error',
//     '@typescript-eslint/prefer-return-this-type': 'error',
//     '@typescript-eslint/prefer-string-starts-ends-with': 'error',
//     '@typescript-eslint/prefer-ts-expect-error': 'error',
//     '@typescript-eslint/type-annotation-spacing': 'error',
//     curly: 'error',
//     'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
//     indent: 'off',
//     // 'max-lines': ['error', { max: 300 }],

//     // 'no-relative-import-paths/no-relative-import-paths': ['error', { allowSameFolder: true }],
//     // Let pretteir handle this
//     'prettier/prettier': [
//       'error',
//       {},
//       {
//         usePrettierrc: true,
//       },
//     ],
//     quotes: ['error', 'single', { avoidEscape: true }],
//     'sort-keys-fix/sort-keys-fix': 'error',
//     'typescript-sort-keys/interface': 'error',
//     'typescript-sort-keys/string-enum': 'error',
//   },
// };

// module.exports = config;
