import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        'vue/index': fileURLToPath(new URL('./src/vue/index.ts', import.meta.url)),
      },
      name: 'ActiveLaneWorkbenchApi',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@activelane/icons', '@activelane/shadcn'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
