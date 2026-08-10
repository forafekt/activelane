import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import wails from '@wailsio/runtime/plugins/vite'
import AutoImport from 'unplugin-auto-import/vite'
// import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  plugins: [
    vue(),
    tailwindcss(),
    // Components({
    //   dirs: ['src/renderer/components'],
    //   deep: true,
    //   dts: true,
    // }),
    AutoImport({
      dts: true,
    }),
    wails('./bindings'),
  ],
})
