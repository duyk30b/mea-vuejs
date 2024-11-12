import ckeditor5 from '@ckeditor/vite-plugin-ckeditor5'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), ckeditor5({ theme: require.resolve('@ckeditor/ckeditor5-theme-lark') })],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@ckeditor') || id.includes('node_modules/ckeditor5')) {
            return 'vendor_ckeditor'
          } else if (id.includes('node_modules/ant-design-vue')) {
            return 'vendor_ant_design_vue'
          } else if (id.includes('node_modules/@ant-design/icons')) {
            return 'vendor_ant_design_icon'
          } else if (id.includes('node_modules/lodash')) {
            return 'vendor_lodash'
          } else if (id.includes('node_modules/monaco-editor')) {
            return 'vendor_monaco_editor'
          } else if (id.includes('node_modules')) {
            return 'vendor'
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
