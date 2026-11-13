const config = {
  'tests/**/*.ts': [
    'prettier --write',
    'oxlint --quiet',
    'eslint',
    () => 'pnpm run tsc-check',
  ],
};

module.exports = config;
