import assert from 'node:assert/strict'
import test from 'node:test'
import { createExtensionRuntime } from '../src/core/runtime/createExtensionRuntime.ts'

test('runtime disposal deactivates extensions exactly once', async () => {
  let activationDisposals = 0
  let deactivations = 0
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test host',
      kind: 'web',
      mode: 'browser',
      capabilities: {},
    },
    extensions: [
      {
        source: 'builtin',
        definition: {
          manifest: {
            id: 'test.lifecycle',
            displayName: 'Lifecycle test',
            version: '1.0.0',
            type: 'ui',
            builtin: true,
            activationEvents: ['onStartup'],
          },
          activate() {
            return { dispose: () => activationDisposals++ }
          },
          deactivate() {
            deactivations++
          },
        },
      },
    ],
  })

  assert.equal(runtime.extensions.getRecord('test.lifecycle')?.active, true)
  await runtime.dispose()
  await runtime.dispose()
  assert.equal(activationDisposals, 1)
  assert.equal(deactivations, 1)
  assert.equal(runtime.extensions.getRecord('test.lifecycle')?.active, false)
})

test('install persists installed state without enabling or activating', async () => {
  let activations = 0
  const installed = {
    id: 'local/example',
    extensionId: '@local/example',
    displayName: 'Example',
    version: '1.0.0',
    enabled: false,
    installSource: 'marketplace',
    installedAt: '2026-08-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
    manifest: { id: '@local/example', name: 'example', displayName: 'Example', version: '1.0.0' },
  }
  const calls = []
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test host',
      kind: 'desktop',
      mode: 'native',
      capabilities: {
        extensions: {
          install: async (...args) => {
            calls.push(args)
            return installed
          },
        },
      },
    },
    extensions: [
      {
        source: 'marketplace',
        definition: {
          manifest: installed.manifest,
          activate() {
            activations++
            return { dispose() {} }
          },
        },
      },
    ],
  })
  await runtime.extensions.install('@local/example', '1.0.0', 'local')
  const record = runtime.extensions.getRecord('@local/example')
  assert.deepEqual(calls, [['@local/example', '1.0.0', 'local']])
  assert.equal(record?.installed, true)
  assert.equal(record?.enabled, false)
  assert.equal(record?.active, false)
  assert.equal(activations, 0)
  await runtime.dispose()
})

test('uninstall reaches native host for installed extensions not discovered by runtime', async () => {
  const calls = []
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test host',
      kind: 'desktop',
      mode: 'native',
      capabilities: {
        extensions: {
          listInstalled: async () => [
            {
              id: 'local/example',
              extensionId: '@local/example',
              displayName: 'Example',
              version: '1.0.0',
              enabled: false,
              installSource: 'marketplace',
              installedAt: '2026-08-15T00:00:00Z',
              updatedAt: '2026-08-15T00:00:00Z',
              manifest: {
                id: '@local/example',
                name: 'example',
                displayName: 'Example',
                version: '1.0.0',
              },
            },
          ],
          uninstall: async (id) => calls.push(id),
        },
      },
    },
  })
  await runtime.extensions.uninstall('@local/example')
  assert.deepEqual(calls, ['@local/example'])
  await runtime.dispose()
})
