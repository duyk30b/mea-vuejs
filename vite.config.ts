import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import vueDevTools from 'vite-plugin-vue-devtools'

const require = createRequire(import.meta.url)

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
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
          if (id.includes('node_modules/tinymce')) {
            return 'vendor_tinymce'
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
