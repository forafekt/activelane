import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACTIVELANE_REGISTRY_API_PREFIX,
  registryMethods,
  registryRoutePatterns,
  registryRoutes,
} from '../dist/index.js'

test('registry route constants share the canonical API prefix', () => {
  for (const route of Object.values(registryRoutePatterns)) {
    assert.equal(route.startsWith(`${ACTIVELANE_REGISTRY_API_PREFIX}/`), true)
  }
  assert.equal(registryRoutes.listExtensions, registryRoutePatterns.listExtensions)
  assert.equal(registryRoutes.publishExtension, registryRoutePatterns.publishExtension)
  assert.equal(registryRoutes.publishers, registryRoutePatterns.publishers)
})

test('registry route builders encode path segments', () => {
  assert.equal(
    registryRoutes.getExtension('active lane', 'test/ext'),
    '/v1/extensions/active%20lane/test%2Fext',
  )
  assert.equal(
    registryRoutes.getVersion('activelane', 'test', '1.0.0-beta.1'),
    '/v1/extensions/activelane/test/versions/1.0.0-beta.1',
  )
})

test('registry method constants match server contract', () => {
  assert.equal(registryMethods.listExtensions, 'GET')
  assert.equal(registryMethods.getExtension, 'GET')
  assert.equal(registryMethods.publishExtension, 'POST')
  assert.equal(registryMethods.yankVersion, 'POST')
  assert.equal(registryMethods.importBundle, 'POST')
})
