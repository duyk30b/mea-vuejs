/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-strongly-recommended',
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
  ],
  overrides: [
    {
      files: ['cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}'],
      extends: ['plugin:cypress/recommended'],
    },
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    vueFeatures: {
      filter: true,
      interpolationAsNonHTML: false,
    },
    sourceType: 'module',
  },
  rules: {
    'vue/attribute-hyphenation': 0,
    'vue/v-on-event-hyphenation': 0,
    '@typescript-eslint/no-unused-vars': 0,
    'vue/multi-word-component-names': 0,
    'vue/no-v-html': 0,

    'padding-line-between-statements': [
      // quy tắc cách 1 dòng
      1,
      { blankLine: 'always', prev: '*', next: ['class', 'function', 'export'] },
      { blankLine: 'always', prev: ['import'], next: '*' },
      { blankLine: 'never', prev: ['import'], next: ['import'] },
      { blankLine: 'any', prev: ['export'], next: ['export'] },
    ],
    'lines-between-class-members': [1, 'always', { exceptAfterSingleLine: true }], // Dòng trống giữa các properties trong Class
  },
}
