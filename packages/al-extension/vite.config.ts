import { defineConfig } from 'vite'

export default defineConfig({
  root: import.meta.dirname,
  build: {
    lib: { entry: { index: 'src/index.ts', view: 'src/view.ts' }, formats: ['es'] },
    target: ['safari15'],
  },
})
