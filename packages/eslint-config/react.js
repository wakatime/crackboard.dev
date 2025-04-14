import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
    },
    rules: {
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...hooksPlugin.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        React: 'writable',
      },
    },
  },
];

// /// <reference types="./types.d.ts" />

// const config = {
//   extends: [
//     'plugin:react/recommended',
//     'plugin:react-hooks/recommended',
//     // 'plugin:jsx-a11y/recommended',
//     'eslint:recommended',
//     'plugin:@typescript-eslint/recommended-type-checked',
//     'plugin:@typescript-eslint/stylistic-type-checked',
//     'prettier',
//     'plugin:@typescript-eslint/recommended-type-checked',
//     'plugin:@typescript-eslint/stylistic-type-checked',
//   ],
//   parser: '@typescript-eslint/parser',
//   parserOptions: {
//     project: true,
//   },
//   plugins: ['@typescript-eslint', 'import', 'prettier', 'sort-keys-fix', 'typescript-sort-keys', 'no-relative-import-paths'],
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

//     'no-relative-import-paths/no-relative-import-paths': ['error', { allowSameFolder: true }],
//     // Let pretteir handle this
//     'prettier/prettier': [
//       'error',
//       {},
//       {
//         usePrettierrc: true,
//       },
//     ],
//     quotes: ['error', 'single', { avoidEscape: true }],
//     'react-hooks/exhaustive-deps': 'error',
//     'react-hooks/rules-of-hooks': 'error',
//     'react/button-has-type': [
//       'error',
//       {
//         button: true,
//         reset: true,
//         submit: true,
//       },
//     ],
//     // 'react/forbid-dom-props': ['error', { forbid: ['style'] }],
//     'react/iframe-missing-sandbox': 'error',
//     'react/jsx-handler-names': 'error',
//     'react/jsx-max-depth': ['error', { max: 6 }],
//     'react/jsx-no-duplicate-props': 'error',
//     'react/jsx-no-leaked-render': 'error',
//     'react/jsx-no-literals': 'off',
//     'react/jsx-no-useless-fragment': 'error',
//     'react/jsx-sort-props': 'error',
//     'react/no-array-index-key': 'error',
//     'react/no-arrow-function-lifecycle': 'error',
//     'react/no-danger': 'error',
//     'react/no-deprecated': 'error',
//     'react/no-this-in-sfc': 'error',
//     'react/no-typos': 'error',
//     'react/prefer-es6-class': ['error', 'always'],
//     'react/prop-types': 'off',
//     'react/self-closing-comp': 'error',
//     'react/sort-comp': 'error',
//     'sort-keys-fix/sort-keys-fix': 'error',
//     'typescript-sort-keys/interface': 'error',
//     'typescript-sort-keys/string-enum': 'error',
//   },
// };

// module.exports = config;
