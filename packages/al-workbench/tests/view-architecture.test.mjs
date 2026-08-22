import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeExtensionAssetPath, resolveExtensionAsset } from '../src/views/assets.ts'
import { ViewInstanceRegistry } from '../src/views/instances.ts'
import { validateViewContributions } from '../src/views/manifest.ts'

const containers = [{ id: 'sample.editors', title: 'Editors', location: 'editor' }]
const views = [
  {
    id: 'sample.editor',
    title: 'Editor',
    container: 'sample.editors',
    multiple: true,
    renderer: { type: 'isolated', entry: './views/editor/index.html' },
    ownerExtensionId: '@sample/tools',
  },
]

test('validates container references and safe HTML entries', () => {
  assert.deepEqual(validateViewContributions({ containers, views }), [])
  const issues = validateViewContributions({
    containers,
    views: [
      {
        ...views[0],
        container: 'missing',
        renderer: { type: 'isolated', entry: '../escape.html' },
      },
    ],
  })
  assert.deepEqual(
    issues.map((issue) => issue.path),
    ['contributes.views.0.container', 'contributes.views.0.renderer.entry'],
  )
})

test('uses resource identity to reveal or create independent editor instances', () => {
  const registry = new ViewInstanceRegistry(() => views)
  const first = registry.create({
    definitionId: 'sample.editor',
    extensionId: '@sample/tools',
    resource: 'request:one',
    context: { requestId: 'one' },
  })
  const firstAgain = registry.create({
    definitionId: 'sample.editor',
    extensionId: '@sample/tools',
    resource: 'request:one',
    context: { requestId: 'corrupt' },
  })
  const second = registry.create({
    definitionId: 'sample.editor',
    extensionId: '@sample/tools',
    resource: 'request:two',
    context: { requestId: 'two' },
  })
  assert.equal(firstAgain, first)
  assert.notEqual(first.id, second.id)
  assert.deepEqual(first.context, { requestId: 'one' })
  assert.deepEqual(second.context, { requestId: 'two' })
  assert.notEqual(first.context, second.context)
  assert.ok(Object.isFrozen(first.context))
  assert.throws(() => {
    first.context.requestId = 'mutated'
  }, TypeError)

  registry.dispose(first.id)
  assert.equal(registry.get(second.id), second)
  const reopened = registry.create({
    definitionId: 'sample.editor',
    extensionId: '@sample/tools',
    resource: 'request:one',
    context: { requestId: 'one-reopened' },
  })
  assert.notEqual(reopened.id, first.id)

  const duplicate = registry.create({
    definitionId: 'sample.editor',
    extensionId: '@sample/tools',
    resource: 'request:two',
    policy: 'always-new',
    context: { requestId: 'two' },
  })
  assert.notEqual(duplicate.id, second.id)
  registry.disposeExtension('@sample/tools')
  assert.equal(registry.instances.size, 0)
})

test('resolves scoped package assets and rejects traversal', async () => {
  assert.equal(
    await resolveExtensionAsset({ baseUrl: '/extensions' }, '@sample/tools', './views/app.html'),
    '/extensions/sample/tools/views/app.html',
  )
  assert.throws(() => normalizeExtensionAssetPath('../secret'))
  assert.throws(() => normalizeExtensionAssetPath('/absolute'))
  assert.equal(
    await resolveExtensionAsset(
      { resolve: async (extensionId, resource) => ({ url: `/host/${extensionId}/${resource}` }) },
      '@sample/tools',
      './views/app.html',
    ),
    '/host/@sample/tools/views/app.html',
  )
})
