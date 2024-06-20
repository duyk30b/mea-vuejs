import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import ckeditor5 from '@ckeditor/vite-plugin-ckeditor5'
import { copy } from 'rollup-plugin-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), ckeditor5({ theme: require.resolve('@ckeditor/ckeditor5-theme-lark') })],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // Cấu hình resolve để chạy plugin sau khi build hoàn tất
    resolve: {
      alias: {
        // Đảm bảo plugin sẽ được chạy sau khi build hoàn tất
        alias: 'ignored',
        plugins: [
          {
            name: 'copy-template-files',
            async writeBundle() {
              const srcDir = 'src/template'
              const destDir = 'dist/template'

              try {
                // Đọc danh sách file từ thư mục src/template
                const files = await fs.readdir(srcDir)

                // Duyệt qua từng file và sao chép vào thư mục build output
                for (const file of files) {
                  const srcFile = path.join(srcDir, file)
                  const destFile = path.join(destDir, file)
                  await fs.copyFile(srcFile, destFile)
                }

                console.log('Đã sao chép các file từ src/template vào dist/template')
              } catch (error) {
                console.error('Lỗi khi sao chép các file:', error)
              }
            },
          },
        ],
      },
    },
  },
})
