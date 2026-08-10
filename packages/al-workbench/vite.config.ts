import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    Components({
      dirs: ['src/components'],
      deep: true,
      dts: true,
    }),
    AutoImport({
      dts: true,
    }),
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        'marketplace/index': fileURLToPath(
          new URL('./src/marketplace/index.ts', import.meta.url),
        ),
        'themes/index': fileURLToPath(new URL('./src/themes/index.ts', import.meta.url)),
      },
      name: 'ActiveLaneWorkbench',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@activelane/shadcn',
        '@activelane/icons',
        '@activelane/workbench-api',
        '@activelane/workbench-api/vue',
      ],
      output: {
        globals: {
          vue: 'Vue',
        },
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith('.css')
            ? 'styles.css'
            : (assetInfo.name ?? 'assets/[name][extname]'),
      },
    },
  },
})
