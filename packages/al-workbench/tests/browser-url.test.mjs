import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const tsxCli = fileURLToPath(new URL('../../../node_modules/tsx/dist/cli.mjs', import.meta.url))

test('browser address normalization supports URLs, localhost, search, and blocked protocols', () => {
  const script = `
    import assert from 'node:assert/strict'
    import { normalizeBrowserAddress, normalizeBrowserUrl } from './packages/al-workbench/src/browser/utils/url.ts'

    assert.equal(normalizeBrowserUrl('example.com').url, 'https://example.com/')
    assert.equal(normalizeBrowserUrl('localhost:5173').url, 'http://localhost:5173/')
    assert.equal(normalizeBrowserAddress('active lane').url, 'https://www.google.com/search?q=active%20lane')
    assert.equal(normalizeBrowserAddress('active lane', 'https://search.test/?q={query}').url, 'https://search.test/?q=active%20lane')
    assert.equal(normalizeBrowserUrl('javascript:alert(1)').ok, false)
    assert.equal(normalizeBrowserUrl('file:///tmp/test.html').ok, false)
  `

  const result = spawnSync(process.execPath, [tsxCli, '-e', script], {
    cwd: fileURLToPath(new URL('../../..', import.meta.url)),
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
