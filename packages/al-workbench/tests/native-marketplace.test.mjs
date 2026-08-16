import assert from 'node:assert/strict'
import test from 'node:test'

import { MarketplaceCatalogService } from '../src/marketplace/services/backendMarketplaceCatalog.ts'

function manifest() {
  return {
    schemaVersion: '1.0.0',
    id: '@local/example',
    publisher: 'local',
    name: 'example',
    displayName: 'Example',
    version: '1.0.0',
    description: 'Example extension',
    entry: 'extension/main.js',
    engines: { activelane: '*' },
    hostSupport: ['desktop'],
    extensionKind: ['workbench'],
  }
}

function createRuntime(overrides = {}) {
  const installCalls = []
  const searchResponse = {
    items: [
      {
        registryId: 'local',
        registryDisplayName: 'Local Registry',
        id: '@local/example',
        namespace: 'local',
        name: 'example',
        displayName: 'Example',
        description: 'Example extension',
        version: '1.0.0',
        versionStatus: 'published',
        manifest: manifest(),
        manifestDigest: 'sha256:manifest',
        packageDigest: 'sha256:package',
        publishedAt: '2026-08-15T00:00:00Z',
        compatible: true,
      },
    ],
    failures: [
      {
        registryId: 'offline',
        registryDisplayName: 'Offline Registry',
        error: { code: 'REGISTRY_UNAVAILABLE', message: 'Registry search is unavailable.' },
      },
    ],
    mode: 'local-only',
    publicRegistryEnabled: false,
    ...overrides,
  }
  const runtime = {
    host: {
      capabilities: {
        registry: { search: async () => searchResponse },
        extensions: { install: true },
      },
    },
    extensions: {
      records: [],
      listInstalled: async () => [],
      install: async (...args) => installCalls.push(args),
    },
    capabilities: { records: [] },
  }
  return { runtime, installCalls }
}

test('native marketplace preserves source and partial registry failure state', async () => {
  const catalog = new MarketplaceCatalogService()
  const { runtime } = createRuntime()
  catalog.setRuntimeApi(runtime)
  await catalog.refresh()

  const extension = catalog.getExtension('@local/example')
  assert.equal(extension.registryId, 'local')
  assert.equal(extension.registryDisplayName, 'Local Registry')
  assert.equal(extension.compatibility, 'compatible')
  assert.deepEqual(catalog.getRegistryState(), {
    mode: 'local-only',
    publicRegistryEnabled: false,
    failures: [
      {
        registryId: 'offline',
        registryDisplayName: 'Offline Registry',
        code: 'REGISTRY_UNAVAILABLE',
        message: 'Registry search is unavailable.',
      },
    ],
  })
})

test('marketplace installs the exact visible source and version', async () => {
  const catalog = new MarketplaceCatalogService()
  const { runtime, installCalls } = createRuntime()
  catalog.setRuntimeApi(runtime)
  await catalog.refresh()
  await catalog.installExtension('@local/example')
  assert.deepEqual(installCalls, [['@local/example', '1.0.0', 'local']])
})

test('marketplace blocks incompatible and yanked releases', async () => {
  for (const fields of [
    { compatible: false, compatibilityReason: 'Wrong architecture.' },
    { versionStatus: 'yanked' },
  ]) {
    const catalog = new MarketplaceCatalogService()
    const base = createRuntime()
    const responseItem = {
      registryId: 'local',
      registryDisplayName: 'Local Registry',
      id: '@local/example',
      namespace: 'local',
      name: 'example',
      displayName: 'Example',
      description: 'Example extension',
      version: '1.0.0',
      versionStatus: 'published',
      manifest: manifest(),
      manifestDigest: 'sha256:m',
      packageDigest: 'sha256:p',
      publishedAt: '2026-08-15T00:00:00Z',
      compatible: true,
      ...fields,
    }
    base.runtime.host.capabilities.registry.search = async () => ({
      items: [responseItem],
      failures: [],
      mode: 'connected',
      publicRegistryEnabled: true,
    })
    catalog.setRuntimeApi(base.runtime)
    await catalog.refresh()
    await assert.rejects(() => catalog.installExtension('@local/example'))
    assert.equal(base.installCalls.length, 0)
  }
})
