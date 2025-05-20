import ckeditor5 from '@ckeditor/vite-plugin-ckeditor5'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import vueDevTools from 'vite-plugin-vue-devtools'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    ckeditor5({ theme: require.resolve('@ckeditor/ckeditor5-theme-lark') }),
    (monacoEditorPlugin as any).default({
      languageWorkers: ['editorWorkerService', 'json', 'html', 'typescript', 'css'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@ckeditor') || id.includes('node_modules/ckeditor5')) {
            return 'vendor_ckeditor'
          } else if (id.includes('node_modules/monaco-editor')) {
            return 'vendor_monaco_editor'
          } else if (id.includes('node_modules/ant-design-vue')) {
            return 'vendor_ant_design_vue'
          } else if (id.includes('node_modules/lodash')) {
            return 'vendor_lodash'
          } else if (id.includes('node_modules')) {
            return 'vendor_node_modules'
          } else if (id.includes('src/modules')) {
            // return 'src_modules'
          } else if (id.includes('src/common')) {
            return 'src_common'
          }
        },
      },
    },
  },
})
