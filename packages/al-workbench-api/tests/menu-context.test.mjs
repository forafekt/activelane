import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateWorkbenchContextExpression } from '../dist/index.js'

test('menu context expressions match platform and os gates', () => {
  const context = {
    platform: 'desktop',
    os: 'macos',
    isDesktop: true,
    isMac: true,
    activeTabKind: 'browser',
  }

  assert.equal(evaluateWorkbenchContextExpression('isDesktop && isMac', context), true)
  assert.equal(evaluateWorkbenchContextExpression('platform == desktop', context), true)
  assert.equal(evaluateWorkbenchContextExpression('activeTabKind == "browser"', context), true)
  assert.equal(evaluateWorkbenchContextExpression('isDesktop && !isMac', context), false)
  assert.equal(evaluateWorkbenchContextExpression('os == windows || os == macos', context), true)
})
