import assert from 'node:assert/strict'
import test from 'node:test'
import { createExtensionRuntime } from '../src/core/runtime/createExtensionRuntime.ts'
import { shouldShowActiveGroupIndicator } from '../src/core/runtime/workbenchStore/layout.ts'
import { createWorkbenchUI, createWorkbenchUIBulkResult } from '../src/core/workbench/ui.ts'

test('UI lookup fails clearly when no implementation is registered', () => {
  const ui = createWorkbenchUI()
  assert.throws(() => ui.getComponent('Missing'), /Unknown Workbench UI component: Missing/)
  assert.throws(() => ui.getBlock('Missing'), /Unknown Workbench UI block: Missing/)
})

test('bulk UI lookup preserves tuple order and named access', () => {
  const entries = { Button: { name: 'Button' }, Input: { name: 'Input' } }
  const result = createWorkbenchUIBulkResult(['Button', 'Input'], (id) => entries[id])
  assert.equal(result[0], entries.Button)
  assert.equal(result[1], entries.Input)
  assert.equal(result.Button, entries.Button)
  assert.equal(result.Input, entries.Input)
})

test('runtime exposes the host-owned UI service', async () => {
  const button = { name: 'Button' }
  const pane = { name: 'ResourceListPane' }
  const runtime = await createExtensionRuntime({
    host: { id: 'ui-test', label: 'UI test', kind: 'web', mode: 'browser', capabilities: {} },
    ui: {
      getComponent: () => button,
      getComponents: (ids) => createWorkbenchUIBulkResult(ids, () => button),
      getBlock: () => pane,
      getBlocks: (ids) => createWorkbenchUIBulkResult(ids, () => pane),
    },
  })
  assert.equal(runtime.workbench.ui.getComponent('Button'), button)
  assert.equal(runtime.workbench.ui.getBlock('ResourceListPane'), pane)
  await runtime.dispose()
})

test('active group treatment only distinguishes groups in a split layout', () => {
  assert.equal(shouldShowActiveGroupIndicator(1, 'group-a', 'group-a'), false)
  assert.equal(shouldShowActiveGroupIndicator(2, 'group-a', 'group-a'), true)
  assert.equal(shouldShowActiveGroupIndicator(2, 'group-b', 'group-a'), false)
  assert.equal(shouldShowActiveGroupIndicator(2, 'group-b', 'group-b'), true)
  assert.equal(shouldShowActiveGroupIndicator(1, 'group-b', 'group-b'), false)
})
