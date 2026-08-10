import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), AutoImport({ dts: true }), Components({ dts: true })],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        lucide: fileURLToPath(new URL('./src/lucide.ts', import.meta.url)),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@lucide/icons', 'vue'],
    },
  },
})
