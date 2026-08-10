import assert from 'node:assert/strict'
import test from 'node:test'
import { registryRoutes } from '../src/core/registry/contracts.ts'
import {
  WorkbenchApiHttpClient,
  WorkbenchApiHttpError,
  WorkbenchApiNetworkError,
  WorkbenchApiResponseParseError,
} from '../src/core/runtime/httpClient.ts'

test('request builds query params and parses JSON responses', async () => {
  let seenUrl = ''
  let seenInit
  const client = new WorkbenchApiHttpClient({
    baseUrl: 'https://registry.example.test',
    credentials: 'include',
    headers: { 'x-client': 'workbench' },
    fetch: async (url, init) => {
      seenUrl = String(url)
      seenInit = init
      return Response.json([{ id: '@activelane/test' }])
    },
  })

  const response = await client.request('/v1/extensions', {
    query: { search: 'codex', visibility: 'public', ignored: undefined },
    signal: AbortSignal.timeout(1000),
  })

  assert.deepEqual(response, [{ id: '@activelane/test' }])
  assert.equal(
    seenUrl,
    'https://registry.example.test/v1/extensions?search=codex&visibility=public',
  )
  assert.equal(seenInit.credentials, 'include')
  assert.equal(new Headers(seenInit.headers).get('x-client'), 'workbench')
})

test('request does not force credentials or headers for simple GET requests', async () => {
  let seenInit
  const client = new WorkbenchApiHttpClient({
    baseUrl: 'http://127.0.0.1:4877',
    fetch: async (_url, init) => {
      seenInit = init
      return Response.json([])
    },
  })

  const response = await client.listRegistryExtensions()

  assert.deepEqual(response, [])
  assert.equal(seenInit.credentials, undefined)
  assert.equal(new Headers(seenInit.headers).get('content-type'), null)
})

test('request sends JSON bodies and custom headers', async () => {
  let body = ''
  let headers
  const client = new WorkbenchApiHttpClient({
    baseUrl: 'https://api.example.test',
    fetch: async (_url, init) => {
      body = init.body
      headers = new Headers(init.headers)
      return Response.json({ ok: true })
    },
  })

  await client.request(registryRoutes.publishers, {
    method: 'POST',
    body: { id: 'activelane' },
    headers: { authorization: 'Bearer token' },
  })

  assert.equal(body, '{"id":"activelane"}')
  assert.equal(headers.get('content-type'), 'application/json')
  assert.equal(headers.get('authorization'), 'Bearer token')
})

test('request distinguishes normalized HTTP errors', async () => {
  const client = new WorkbenchApiHttpClient({
    baseUrl: 'https://api.example.test',
    fetch: async () =>
      Response.json(
        { error: { code: 'NOT_FOUND', message: 'Missing extension.', status: 404 } },
        { status: 404 },
      ),
  })

  await assert.rejects(
    () => client.request('/v1/extensions/activelane/missing'),
    (error) =>
      error instanceof WorkbenchApiHttpError &&
      error.message === 'NOT_FOUND: Missing extension.' &&
      error.registryError.code === 'NOT_FOUND',
  )
})

test('request distinguishes network failures', async () => {
  const client = new WorkbenchApiHttpClient({
    baseUrl: 'https://api.example.test',
    fetch: async () => {
      throw new TypeError('connection refused')
    },
  })

  await assert.rejects(
    () => client.request('/v1/extensions'),
    (error) => error instanceof WorkbenchApiNetworkError && error.cause instanceof TypeError,
  )
})

test('request distinguishes invalid JSON responses', async () => {
  const client = new WorkbenchApiHttpClient({
    baseUrl: 'https://api.example.test',
    fetch: async () =>
      new Response('{bad json', { headers: { 'content-type': 'application/json' } }),
  })

  await assert.rejects(
    () => client.request('/v1/extensions'),
    (error) => error instanceof WorkbenchApiResponseParseError && error.bodyText === '{bad json',
  )
})

test('request safely handles empty responses', async () => {
  const client = new WorkbenchApiHttpClient({
    baseUrl: 'https://api.example.test',
    fetch: async () => new Response(null, { status: 204 }),
  })

  assert.equal(await client.request(registryRoutes.importBundle, { method: 'POST' }), undefined)
})
