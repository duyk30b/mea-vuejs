import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  ...pluginOxlint.configs['flat/recommended'],
  skipFormatting,
  {
    name: 'custom-rules',
    rules: {
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-vars': 0,
      'vue/multi-word-component-names': 0,
      'vue/no-v-html': 0,
      'prefer-const': 0,
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
  },
)
