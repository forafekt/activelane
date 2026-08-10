import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isShowcase = command === 'serve' || mode === 'showcase'

  return {
    plugins: [
      tailwindcss(),
      vue(),
      Components({
        dirs: ['src/components/ui'],
        deep: true,
        dts: true,
      }),
      AutoImport({
        dts: true,
      }),
    ],
    build: isShowcase
      ? {
          outDir: 'dist-showcase',
        }
      : {
          emptyOutDir: false,
          lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            name: 'ActiveLaneShadcn',
            fileName: 'index',
            formats: ['es'],
          },
          rollupOptions: {
            external: [
              'vue',
              'reka-ui',
              'reka-ui/date',
              '@vueuse/core',
              '@internationalized/date',
              '@activelane/icons',
              '@tanstack/vue-table',
              '@unovis/vue',
              'class-variance-authority',
              'embla-carousel-vue',
              'vaul-vue',
              'vee-validate',
              'vue-input-otp',
              'vue-sonner',
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
  }
})
