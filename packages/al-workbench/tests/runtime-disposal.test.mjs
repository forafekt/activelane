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
