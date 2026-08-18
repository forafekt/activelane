import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveWorkbenchExtensionModule } from '../src/core/extensions/module.ts'

const descriptor = {
  extensionId: '@fixture/example',
  version: '1.2.3',
  source: 'fixture-registry',
  entrypoint: '/extensions/fixture/example/1.2.3/dist/extension.js',
}

const definition = {
  manifest: { id: descriptor.extensionId, displayName: 'Example', version: descriptor.version },
  activate() {},
}

test('resolves only the canonical default extension definition export', () => {
  assert.equal(resolveWorkbenchExtensionModule({ default: definition }, descriptor), definition)
})

test('rejects a factory-only module with boundary diagnostics', () => {
  assert.throws(
    () => resolveWorkbenchExtensionModule({ createExtension() {} }, descriptor),
    (error) => {
      assert.match(error.message, /@fixture\/example@1\.2\.3/)
      assert.match(error.message, /fixture-registry/)
      assert.match(error.message, /dist\/extension\.js/)
      assert.match(error.message, /expected the ES module default export/)
      assert.match(error.message, /createExtension:function/)
      return true
    },
  )
})

test('rejects default definitions whose identity or version differs from installation metadata', () => {
  assert.throws(
    () =>
      resolveWorkbenchExtensionModule(
        { default: { ...definition, manifest: { ...definition.manifest, id: '@fixture/other' } } },
        descriptor,
      ),
    /declares extension @fixture\/other/,
  )
  assert.throws(
    () =>
      resolveWorkbenchExtensionModule(
        { default: { ...definition, manifest: { ...definition.manifest, version: '9.0.0' } } },
        descriptor,
      ),
    /declares version 9\.0\.0/,
  )
})
