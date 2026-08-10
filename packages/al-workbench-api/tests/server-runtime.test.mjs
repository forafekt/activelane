import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createActiveLaneServerRuntime,
  normalizeServerExtensionDeclaration,
} from '../dist/index.js'

function manifest(server = {}) {
  return {
    id: '@test/server',
    name: 'server',
    displayName: 'Test Server',
    version: '1.0.0',
    description: 'Test server extension.',
    server: {
      entry: './server.js',
      startup: 'manual',
      ...server,
    },
  }
}

test('server manifest declarations are normalized with defaults', () => {
  const result = normalizeServerExtensionDeclaration({
    id: 'api',
    label: 'API',
    entry: './server.js',
    startup: 'auto',
    restart: { policy: 'never' },
    health: { http: '/health' },
  })

  assert.equal(result.ok, true)
  assert.equal(result.server.id, 'api')
  assert.equal(result.server.label, 'API')
  assert.equal(result.server.mode, 'subprocess')
  assert.equal(result.server.startup, 'auto')
  assert.equal(result.server.autoStart, true)
  assert.equal(result.server.health.intervalMs, 5000)
  assert.equal(result.server.ports.env, 'ACTIVELANE_EXTENSION_PORT')
})

test('server manager registers manual servers without starting them', () => {
  const runtime = createActiveLaneServerRuntime({ hostKind: 'desktop' })
  const handle = runtime.registerExtension({ manifest: manifest() })

  assert.equal(handle.status, 'idle')
  assert.equal(runtime.listServers().length, 1)
  assert.equal(runtime.getServer(handle.id), handle)
  assert.equal(runtime.getServerStatus(handle.id).startup, 'manual')
})

test('server manager tracks status transitions and logs', async () => {
  const runtime = createActiveLaneServerRuntime({
    hostKind: 'desktop',
    launcher({ log }) {
      for (let index = 0; index < 105; index += 1) log('stdout', `line ${index}`)
      return { pid: 123, port: 4567, stop: () => log('system', 'stopped') }
    },
  })
  const handle = runtime.registerExtension({ manifest: manifest({ logBufferSize: 100 }) })
  const statuses = []
  runtime.watchServerStatus((status) => statuses.push(status.status))

  await runtime.startServer(handle.id)
  await runtime.stopServer(handle.id)

  assert.equal(runtime.getServerStatus(handle.id).status, 'stopped')
  assert.equal(statuses.includes('running'), true)
  assert.equal(statuses.includes('stopped'), true)
  const logs = await handle.getLogs()
  assert.equal(logs.length, 100)
  assert.equal(
    logs.some((entry) => entry.message === 'stopped'),
    true,
  )
})

test('restart policy restarts on reported process failure with crash-loop bounds', async () => {
  let exits
  let starts = 0
  const runtime = createActiveLaneServerRuntime({
    hostKind: 'desktop',
    launcher({ onExit }) {
      starts += 1
      exits = onExit
      return { pid: 100 + starts }
    },
  })
  const handle = runtime.registerExtension({
    manifest: manifest({
      restart: { policy: 'on-failure', maxRestarts: 1, windowMs: 60000, backoffMs: 0 },
    }),
  })

  await runtime.startServer(handle.id)
  exits({ code: 1 })
  await new Promise((resolve) => setTimeout(resolve, 10))
  exits({ code: 1 })
  await new Promise((resolve) => setTimeout(resolve, 10))

  assert.equal(starts, 2)
  assert.equal(runtime.getServerStatus(handle.id).status, 'failed')
  assert.equal(runtime.getServerStatus(handle.id).crashCount, 2)
})
