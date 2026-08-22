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

test('creates independent editor instances with isolated context', () => {
  const registry = new ViewInstanceRegistry(() => views)
  const first = registry.create({
    definitionId: 'sample.editor',
    extensionId: '@sample/tools',
    instanceId: 'one',
    context: { requestId: 'one' },
  })
  const second = registry.create({
    definitionId: 'sample.editor',
    extensionId: '@sample/tools',
    instanceId: 'two',
    context: { requestId: 'two' },
  })
  assert.notEqual(first.id, second.id)
  assert.deepEqual(second.context, { requestId: 'two' })
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
})
