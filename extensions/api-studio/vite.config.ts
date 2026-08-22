import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(import.meta.dirname, 'src'),
  base: './',
  server: { cors: true },
  build: {
    target: ['safari15'],
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: {
        extension: resolve(import.meta.dirname, 'src/extension.ts'),
        'views/sidebar/index': resolve(import.meta.dirname, 'src/views/sidebar/index.html'),
        'views/editor/index': resolve(import.meta.dirname, 'src/views/editor/index.html'),
        'views/inspector/index': resolve(import.meta.dirname, 'src/views/inspector/index.html'),
        'views/log/index': resolve(import.meta.dirname, 'src/views/log/index.html'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'extension' ? 'extension.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
