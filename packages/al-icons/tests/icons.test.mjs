import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'

function render(component, props) {
  return renderToString(createSSRApp({ render: () => h(component, props) }))
}

test('getIcon returns an offline-renderable Vue component and forwards attrs', async () => {
  const { getIcon } = await import('../src/index.ts')
  const Check = getIcon('lucide.check')
  const svg = await render(Check, { size: 18, class: 'check-glyph' })
  assert.match(svg, /width="18"/)
  assert.match(svg, /height="18"/)
  assert.match(svg, /aria-hidden="true"/)
  assert.match(svg, /class="[^"]*check-glyph/)
})

test('labelled icons expose an image role', async () => {
  const { getIcon } = await import('../src/index.ts')
  const Settings = getIcon('lucide.settings')
  const svg = await render(Settings, { 'aria-label': 'Settings' })
  assert.match(svg, /role="img"/)
  assert.match(svg, /aria-label="Settings"/)
  assert.doesNotMatch(svg, /aria-hidden/)
})

test('references normalize, malformed values throw, and components are cached', async () => {
  const { getIcon, normalizeIconReference } = await import('../src/index.ts')
  assert.equal(normalizeIconReference('simple-icons.github'), 'simple-icons:github')
  assert.equal(getIcon('lucide.search'), getIcon('lucide.search'))
  for (const invalid of ['check', 'lucide', '.check', 'lucide.', 'lucide..check']) {
    assert.throws(() => getIcon(invalid), /Expected "namespace\.icon"/)
  }
})

test('missing local icons render the controlled fallback', async () => {
  const { getIcon } = await import('../src/index.ts')
  const Missing = getIcon('lucide.does-not-exist')
  assert.match(await render(Missing, { size: 14 }), /<svg/)
})
