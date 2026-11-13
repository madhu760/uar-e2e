import { defineConfig } from 'eslint/config';
import playwright from 'eslint-plugin-playwright';
import globalEslintConfig, {
  remapOxlintImportOffs,
} from '../../eslint.config.js';
import oxlintConfig from 'eslint-plugin-oxlint';

export default defineConfig(
  {
    extends: [globalEslintConfig, playwright.configs['flat/recommended']],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: false,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
        },
      ],
    },
  },
  ...remapOxlintImportOffs(
    oxlintConfig.buildFromOxlintConfigFile('./.oxlintrc.json'),
  ),
);
