import vue from '../../apps/desktop/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs'
import { defineConfig } from '../../apps/desktop/frontend/node_modules/vite/dist/node/index.js'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: ['safari15'],
    lib: { entry: 'src/extension.ts', formats: ['es'], fileName: () => 'extension.js' },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
