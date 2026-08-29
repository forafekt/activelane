import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(import.meta.dirname, 'src'),
  base: './',
  server: { cors: true },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: {
        extension: resolve(import.meta.dirname, 'src/extension.ts'),
        'views/editor/index': resolve(import.meta.dirname, 'src/views/editor/index.html'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'extension' ? 'extension.js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
