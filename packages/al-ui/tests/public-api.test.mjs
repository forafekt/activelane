import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import * as ui from '../dist/index.js'

test('public API and typed catalogs expose representative families', () => {
  assert.ok(ui.Button)
  assert.ok(ui.Input)
  assert.ok(ui.DataTable)
  assert.ok(ui.Tree)
  assert.ok(ui.Dialog)
  assert.ok(ui.UiProvider)
  assert.ok(ui.Toolbar)
  for (const id of ['button', 'data-table', 'tree', 'otp-input', 'virtual-list'])
    assert.ok(ui.componentCatalog[id], id)
  assert.equal(ui.catalogEntries.find((entry) => entry.id === 'toolbar')?.kind, 'block')
})

test('provider and components render together on the server', async () => {
  const app = createSSRApp({
    render: () =>
      h(
        ui.UiProvider,
        { theme: 'dark', density: 'compact' },
        { default: () => h(ui.Button, { disabled: true }, { default: () => 'Run' }) },
      ),
  })
  const html = await renderToString(app)
  assert.match(html, /data-theme="dark"/)
  assert.match(html, /data-density="compact"/)
  assert.match(html, /Run/)
  assert.match(html, /disabled/)
})

test('theme and density switching produce different scoped contracts', async () => {
  const render = (theme, density) =>
    renderToString(
      createSSRApp({
        render: () => h(ui.UiProvider, { theme, density }, { default: () => h('span', 'content') }),
      }),
    )
  const compact = await render('light', 'compact')
  const comfortable = await render('high-contrast', 'comfortable')
  assert.match(compact, /--al-ui-control-height:1.75rem/)
  assert.match(comfortable, /data-theme="high-contrast"/)
  assert.match(comfortable, /--al-ui-control-height:2.125rem/)
})
