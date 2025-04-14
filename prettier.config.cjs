/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
  printWidth: 140,
  singleQuote: true,
  trailingComma: 'all',
};

module.exports = config;
