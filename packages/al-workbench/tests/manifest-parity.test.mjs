import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { normalizeActiveLaneManifest } from '../src/core/extensions/manifest.ts'

test('shared example manifest satisfies the TypeScript protocol validator', async () => {
  const url = new URL(
    '../../../examples/extensions/hello/activelane.manifest.json',
    import.meta.url,
  )
  const manifest = JSON.parse(await readFile(url, 'utf8'))
  const result = normalizeActiveLaneManifest(manifest)
  assert.equal(result.ok, true, JSON.stringify(result.issues))
  assert.equal(result.manifest?.id, '@local/hello')
  assert.equal(result.manifest?.version, '1.0.0')
})

test('platform fields reject values outside the language-neutral schema', () => {
  const result = normalizeActiveLaneManifest({
    schemaVersion: '1.0.0',
    id: '@local/example',
    publisher: 'local',
    name: 'example',
    displayName: 'Example',
    version: '1.0.0',
    description: 'Example',
    entry: 'extension/main.js',
    engines: { activelane: '*' },
    hostSupport: ['desktop'],
    extensionKind: ['workbench'],
    os: ['plan9'],
    architecture: ['mips'],
  })
  assert.equal(result.ok, false)
  assert.deepEqual(
    result.issues.map((issue) => issue.path),
    ['os.0', 'architecture.0'],
  )
})
