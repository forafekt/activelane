import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [
    vue(),
    {
      name: 'activelane-self-contained-css',
      enforce: 'post',
      generateBundle(_options, bundle) {
        const css = Object.values(bundle)
          .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
          .map((item) => String(item.source))
          .join('\n')
        if (!css) return
        for (const [fileName, item] of Object.entries(bundle)) {
          if (item.type === 'chunk' && item.isEntry) {
            item.code = `const style=document.createElement('style');style.dataset.activelaneExtension='@activelane/api-studio';style.textContent=${JSON.stringify(css)};document.head.appendChild(style);\n${item.code}`
          }
          if (item.type === 'asset' && fileName.endsWith('.css')) delete bundle[fileName]
        }
      },
    },
    {
      name: 'activelane-browser-runtime-contract',
      enforce: 'post',
      generateBundle(_options, bundle) {
        for (const item of Object.values(bundle)) {
          if (item.type !== 'chunk') continue
          const nodeGlobal = item.code.match(/\b(?:process|require|__dirname|__filename)\b|module\.exports/)
          if (nodeGlobal) {
            this.error(`Installed extension bundle contains Node global ${nodeGlobal[0]}.`)
          }
        }
      },
    },
  ],
  build: {
    lib: {
      entry: 'src/extension.ts',
      formats: ['es'],
      fileName: () => 'extension.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    // Installed extensions execute as browser-native ES modules. Runtime dependencies
    // are bundled so the package is self-contained and has no Vite-time import map.
  },
})
