import js from '@eslint/js';
import globals from 'globals';
import playwright from 'eslint-plugin-playwright';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import customPlugin from './eslint-plugin-custom-rules/index.js';

// Enable every custom rule registered in the plugin's index.js so the config can never drift out of sync with the
// registered rule set. Rules default to 'error'; list only the exceptions here.
const customRuleSeverityOverrides = {
  'find-unused-examples': 'warn',
  'verify-req-config': 'warn',
};
const customRules = Object.fromEntries(Object.keys(customPlugin.rules).map((name) => [`custom/${name}`, customRuleSeverityOverrides[name] ?? 'error']));

const SPECS = ['playwright/integration/**/*.spec.js', 'playwright/e2e/**/*.spec.js'];

export default [
  {
    ignores: ['**/node_modules', 'reports/**', 'test-results/**', '**/*.d.ts'],
  },
  js.configs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: { custom: customPlugin },
    rules: {
      'prettier/prettier': 'warn',
      semi: ['error', 'always'],
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': 'error',
      'no-unused-vars': 'error',
      'no-use-before-define': ['error', { functions: false }],
      ...customRules,
    },
  },
  {
    files: ['**/*.cjs', 'bin/**/*.js', 'scripts/**/*.js', 'eslint-plugin-custom-rules/**/*.js', 'config/**/*.js', 'playwright.config.js', 'playwright/constants/timeouts.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    files: ['scripts/report-template/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['playwright/**/*.js'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Skipped tests are deliberate coverage markers for not-yet-automated or bug-blocked requirements.
      'playwright/no-skipped-test': 'off',
      // Empty test.skip placeholders are deliberate; custom/do-not-allow-empty-blocks guards every other test body.
      'playwright/expect-expect': 'off',
      // Layout is owned by custom/enforce-spec-blank-lines (no blank line between tests, one before a nested describe).
      'playwright/consistent-spacing-between-blocks': 'off',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-force-option': 'warn',
      'playwright/no-element-handle': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-useless-not': 'error',
    },
  },
  {
    files: SPECS,
    rules: {
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1], ignoreArrayIndexes: true }],
    },
  },
];
