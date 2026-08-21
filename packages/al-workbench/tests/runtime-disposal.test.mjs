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

test('install dynamically loads, enables, and activates an undiscovered extension', async () => {
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
          enable: async () => ({ ...installed, enabled: true }),
          load: async () => ({
            manifest: installed.manifest,
            activate() {
              activations++
              return { dispose() {} }
            },
          }),
        },
      },
    },
  })
  await runtime.extensions.install('@local/example', '1.0.0', 'local')
  const record = runtime.extensions.getRecord('@local/example')
  assert.deepEqual(calls, [['@local/example', '1.0.0', 'local']])
  assert.equal(record?.installed, true)
  assert.equal(record?.enabled, true)
  assert.equal(record?.active, true)
  assert.equal(activations, 1)
  await runtime.dispose()
})

test('extension activation does not depend on subscription or entitlement network state', async () => {
  let entitlementRequests = 0
  let activations = 0
  const installed = {
    id: 'local/example',
    extensionId: '@local/example',
    displayName: 'Example',
    version: '1.0.0',
    enabled: true,
    installSource: 'marketplace',
    installedAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z',
    manifest: { id: '@local/example', name: 'example', displayName: 'Example', version: '1.0.0' },
  }
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test host',
      kind: 'desktop',
      mode: 'native',
      capabilities: {
        subscriptions: {
          resolveEntitlements: async () => {
            entitlementRequests++
            throw new Error('subscription not found')
          },
        },
        extensions: {
          listInstalled: async () => [installed],
          load: async () => ({
            manifest: installed.manifest,
            activate() {
              activations++
            },
          }),
        },
      },
    },
  })

  assert.equal(runtime.extensions.getRecord('@local/example')?.active, true)
  assert.equal(activations, 1)
  assert.equal(entitlementRequests, 0)
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

test('installed discovery isolates failures and disposes only the disabled owner', async () => {
  const installed = ['a', 'broken', 'b', 'disabled'].map((name) => ({
    id: `local/${name}`,
    extensionId: `@local/${name}`,
    displayName: name,
    version: '1.0.0',
    enabled: name !== 'disabled',
    installSource: 'marketplace',
    installedAt: '2026-08-17T00:00:00Z',
    updatedAt: '2026-08-17T00:00:00Z',
    manifest: { id: `@local/${name}`, name, displayName: name, version: '1.0.0' },
  }))
  const loads = []
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test',
      kind: 'desktop',
      mode: 'native',
      capabilities: {
        extensions: {
          listInstalled: async () => installed,
          load: async (record) => {
            loads.push(record.extensionId)
            if (record.extensionId === '@local/broken') throw new Error('broken module')
            return {
              manifest: record.manifest,
              activate(context) {
                context.contribute.activityRail({
                  id: `${record.extensionId}.activity`,
                  title: record.displayName,
                })
              },
            }
          },
          disable: async (id) => ({
            ...installed.find((item) => item.extensionId === id),
            enabled: false,
          }),
        },
      },
    },
  })

  assert.deepEqual(loads, ['@local/a', '@local/broken', '@local/b'])
  assert.equal(runtime.extensions.getRecord('@local/a')?.active, true)
  assert.equal(runtime.extensions.getRecord('@local/broken')?.status, 'error')
  assert.equal(runtime.extensions.getRecord('@local/b')?.active, true)
  assert.equal(runtime.extensions.getRecord('@local/disabled')?.active, false)
  await runtime.extensions.disable('@local/a')
  assert.equal(
    runtime.registry.activityRail.some((item) => item.ownerExtensionId === '@local/a'),
    false,
  )
  assert.equal(
    runtime.registry.activityRail.some((item) => item.ownerExtensionId === '@local/b'),
    true,
  )
  await runtime.dispose()
})

test('updating an active installed extension swaps its runtime definition and reactivates', async () => {
  const makeInstalled = (version) => ({
    id: 'local/example',
    extensionId: '@local/example',
    displayName: 'Example',
    version,
    enabled: true,
    installSource: 'marketplace',
    installedAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z',
    manifest: { id: '@local/example', name: 'example', displayName: 'Example', version },
  })
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test',
      kind: 'desktop',
      mode: 'native',
      capabilities: {
        extensions: {
          listInstalled: async () => [makeInstalled('1.0.0')],
          install: async () => makeInstalled('2.0.0'),
          load: async (record) => ({
            manifest: record.manifest,
            activate(context) {
              context.contribute.activityRail({ id: 'example.activity', title: record.version })
            },
          }),
        },
      },
    },
  })
  assert.equal(runtime.registry.activityRail[0]?.title, '1.0.0')
  await runtime.extensions.install('@local/example', '2.0.0', 'local')
  assert.equal(runtime.extensions.getRecord('@local/example')?.manifest.version, '2.0.0')
  assert.equal(runtime.extensions.getRecord('@local/example')?.active, true)
  assert.deepEqual(
    runtime.registry.activityRail.map((item) => item.title),
    ['2.0.0'],
  )
  await runtime.dispose()
})

test('disable, re-enable, and uninstall dispose contributions without duplication', async () => {
  let activations = 0
  let activationDisposals = 0
  let deactivations = 0
  let installed = {
    id: 'fixture/lifecycle',
    extensionId: '@fixture/lifecycle',
    displayName: 'Lifecycle',
    version: '1.0.0',
    enabled: true,
    installSource: 'marketplace',
    installedAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z',
    manifest: { id: '@fixture/lifecycle', displayName: 'Lifecycle', version: '1.0.0' },
  }
  const definition = {
    manifest: installed.manifest,
    activate(context) {
      activations++
      context.contribute.activityRail({ id: 'fixture.activity', title: 'Fixture' })
      return { dispose: () => activationDisposals++ }
    },
    deactivate() {
      deactivations++
    },
  }
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test',
      kind: 'desktop',
      mode: 'native',
      capabilities: {
        extensions: {
          listInstalled: async () => [installed],
          load: async () => definition,
          enable: async () => (installed = { ...installed, enabled: true }),
          disable: async () => (installed = { ...installed, enabled: false }),
          uninstall: async () => undefined,
        },
      },
    },
  })

  assert.equal(activations, 1)
  assert.equal(runtime.registry.activityRail.length, 1)
  await runtime.extensions.disable(installed.extensionId)
  assert.equal(deactivations, 1)
  assert.equal(activationDisposals, 1)
  assert.equal(runtime.registry.activityRail.length, 0)
  await runtime.extensions.enable(installed.extensionId)
  assert.equal(activations, 2)
  assert.equal(runtime.registry.activityRail.length, 1)
  await runtime.extensions.uninstall(installed.extensionId)
  assert.equal(deactivations, 2)
  assert.equal(activationDisposals, 2)
  assert.equal(runtime.registry.activityRail.length, 0)
  await runtime.dispose()
})

test('failed activation rolls back every contribution registered before the error', async () => {
  const installed = {
    id: 'fixture/broken',
    extensionId: '@fixture/broken',
    displayName: 'Broken',
    version: '1.0.0',
    enabled: true,
    installSource: 'marketplace',
    installedAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z',
    manifest: { id: '@fixture/broken', displayName: 'Broken', version: '1.0.0' },
  }
  const runtime = await createExtensionRuntime({
    host: {
      id: 'test',
      label: 'Test',
      kind: 'desktop',
      mode: 'native',
      capabilities: {
        extensions: {
          listInstalled: async () => [installed],
          load: async () => ({
            manifest: installed.manifest,
            activate(context) {
              context.contribute.activityRail({ id: 'broken.activity', title: 'Broken' })
              throw new Error('activation exploded')
            },
          }),
        },
      },
    },
  })

  assert.equal(runtime.extensions.getRecord(installed.extensionId)?.status, 'error')
  assert.equal(runtime.registry.activityRail.length, 0)
  await runtime.dispose()
})
