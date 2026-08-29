import assert from 'node:assert/strict'
import test from 'node:test'
import { createExtensionDiagnosticsService } from '../src/core/diagnostics/service.ts'

test('diagnostics are bounded, deduplicated, and clear by owner lifecycle', () => {
  const active = []
  const diagnostics = createExtensionDiagnosticsService(active)
  const first = diagnostics.report({
    extensionId: '@sample/tools',
    generation: 1,
    severity: 'error',
    source: 'view',
    code: 'VIEW_DOCUMENT_LOAD_FAILED',
    message: 'safe message',
    detail: '/private/developer/detail',
    viewInstanceId: 'view-one',
  })
  const replacement = diagnostics.report({
    extensionId: '@sample/tools',
    generation: 1,
    severity: 'error',
    source: 'view',
    code: 'VIEW_DOCUMENT_LOAD_FAILED',
    message: 'still safe',
    viewInstanceId: 'view-one',
  })
  assert.equal(active.length, 1)
  assert.notEqual(first.id, replacement.id)
  diagnostics.clearView('view-one')
  assert.equal(active.length, 0)

  diagnostics.report({
    extensionId: '@sample/tools',
    generation: 1,
    severity: 'warning',
    source: 'runtime',
    code: 'EXT_RUNTIME_BUILD_FAILED',
    message: 'generation one',
  })
  diagnostics.report({
    extensionId: '@sample/tools',
    generation: 2,
    severity: 'warning',
    source: 'runtime',
    code: 'EXT_RUNTIME_BUILD_FAILED',
    message: 'generation two',
  })
  diagnostics.clearExtension('@sample/tools', 1)
  assert.deepEqual(
    active.map((item) => item.generation),
    [2],
  )
})
