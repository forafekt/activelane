import { defineConfig } from 'vite'

export default defineConfig({
  root: import.meta.dirname,
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js' },
    target: ['safari15'],
  },
})
