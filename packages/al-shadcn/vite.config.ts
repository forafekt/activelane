import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isShowcase = command === 'serve' || mode === 'showcase'

  return {
    plugins: [tailwindcss(), vue()],
    build: isShowcase
      ? {
          outDir: 'dist-showcase',
        }
      : {
          emptyOutDir: true,
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
              '@vueuse/core',
              '@activelane/icons',
              'class-variance-authority',
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
