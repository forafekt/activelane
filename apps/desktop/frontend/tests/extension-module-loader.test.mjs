import assert from 'node:assert/strict'
import test from 'node:test'
import { loadNativeExtensionModule } from '../src/services/extensionModuleLoader.ts'

const record = {
  id: '@fixture/example',
  extensionId: '@fixture/example',
  displayName: 'Example',
  version: '1.2.3',
  enabled: true,
  state: 'enabled',
  installSource: 'marketplace',
  installedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  resolvedPath: '/extensions/fixture/example/1.2.3',
  manifest: {
    id: '@fixture/example',
    name: 'example',
    displayName: 'Example',
    version: '1.2.3',
    entry: 'activelane.manifest.json',
  },
}

test('rejects JSON extension entrypoints before WebKit parses them as modules', async () => {
  await assert.rejects(
    () =>
      loadNativeExtensionModule({
        record,
        payload: {
          source: '{"id":"@fixture/example","name":"example"}',
          entrypoint: '/extensions/fixture/example/1.2.3/activelane.manifest.json',
          contentType: 'application/octet-stream',
          sizeBytes: 42,
          sha256: 'abc123',
        },
      }),
    (error) => {
      assert.match(error.message, /Failed to load extension @fixture\/example@1\.2\.3/)
      assert.match(error.message, /Entrypoint: .*activelane\.manifest\.json/)
      assert.match(error.message, /Content-Type: application\/octet-stream/)
      assert.match(error.message, /Phase: native response validation/)
      assert.match(error.message, /Expected JavaScript module source/)
      return true
    },
  )
})

