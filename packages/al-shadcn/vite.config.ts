import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import RekaResolver from 'reka-ui/resolver'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isShowcase = command === 'serve' || mode === 'showcase'

  return {
    plugins: [
      tailwindcss(),
      Components({
        dts: true,
        resolvers: [
          RekaResolver(),

          // RekaResolver({
          //   prefix: '' // use the prefix option to add Prefix to the imported components
          // })
        ],
      }),
      vue(),
    ],
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
