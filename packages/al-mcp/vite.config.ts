import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    watch: {
      // https://vite.dev/config/server-options
      include: 'src/**',
      exclude: ['node_modules/**', 'dist/**'],
    },
  },
})
