import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import wails from '@wailsio/runtime/plugins/vite'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineConfig, transformWithEsbuild, type Plugin } from 'vite'

function safariDevDependencyTarget(): Plugin {
  // Only execute the plugin logic if the host machine is macOS
  const isMac = process.platform === 'darwin'

  return {
    name: 'activelane:safari-dev-dependency-target',
    // Ensures it only executes during 'npm run dev'
    apply: 'serve', 
    configureServer(server) {
      // Completely skip adding the middleware if not on macOS
      if (!isMac) return

      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/node_modules/.vite/deps/naive-ui.js')) {
          next()
          return
        }

        try {
          const filename = join(server.config.root, 'node_modules/.vite/deps/naive-ui.js')
          const code = await readFile(filename, 'utf8')
          const transformed = await transformWithEsbuild(
            code,
            filename,
            {
              format: 'esm',
              target: 'safari15',
            },
            undefined,
            server.config,
          )
          response.setHeader('Content-Type', 'text/javascript')
          response.end(transformed.code)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  resolve: {
    alias: {
      '~/bindings': new URL('./bindings', import.meta.url).pathname,
    },
  },
  plugins: [safariDevDependencyTarget(), vue(), tailwindcss(), wails('./bindings')],
})
