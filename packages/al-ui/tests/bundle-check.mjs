import assert from 'node:assert/strict'
import { build } from 'esbuild'

const result = await build({
  stdin: {
    contents: "import { Button } from './dist/components.js'; console.log(Button)",
    resolveDir: process.cwd(),
    sourcefile: 'isolated.ts',
  },
  bundle: true,
  format: 'esm',
  write: false,
  external: ['vue', 'naive-ui', 'naive-ui/*'],
})

const bytes = result.outputFiles.reduce((sum, file) => sum + file.contents.byteLength, 0)

assert.ok(bytes < 12_000, `isolated component entry was ${bytes} bytes`)

console.log(`isolated Button import: ${bytes} bytes (Vue and Naive UI external)`)
