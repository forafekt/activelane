import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const entries = ['index', 'components', 'blocks', 'theme', 'providers', 'composables', 'catalog']

const packageRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: packageRoot,
  plugins: [vue()],
  build: {
    target: ['safari15'],
    emptyOutDir: false,
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    cssCodeSplit: false,
    lib: {
      entry: Object.fromEntries(
        entries.map((name) => [
          name,
          fileURLToPath(
            new URL(
              `./src/${name === 'index' || name === 'catalog' ? `${name}.ts` : `${name}/index.ts`}`,
              import.meta.url,
            ),
          ),
        ]),
      ),
      formats: ['es'],
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: ['vue', '@activelane/icons', /^naive-ui(?:\/.*)?/],
      // output: { entryFileNames: '[name].js', chunkFileNames: '[name]-[hash].js' },
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
