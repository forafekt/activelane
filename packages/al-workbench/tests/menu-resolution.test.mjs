import assert from 'node:assert/strict'
import test from 'node:test'
import { createDesktopNativeMenuSnapshot, resolveApplicationMenus } from '../dist/index.js'

function createRegistry() {
  return {
    parts: [],
    statusBar: [],
    globalMenus: [
      { id: 'menu.file', menuId: 'file', title: 'File', order: 10 },
      { id: 'menu.edit', menuId: 'edit', title: 'Edit', order: 20 },
    ],
    activityRail: [],
    apps: [],
    sidebarViews: [],
    commands: [
      { id: 'core.open', title: 'Open', shortcut: 'Mod+O' },
      { id: 'extension.alpha.run', title: 'Alpha: Run' },
      { id: 'context.visible', title: 'Context Visible' },
      { id: 'context.hidden', title: 'Context Hidden' },
    ],
    commandPalette: [],
    tabRenderers: [],
    tabSurfaces: [],
    tabToolbarActions: [],
    tabContextMenu: [],
    bottomPaneViews: [],
    inspectorPanels: [],
    settingsPages: [],
    menus: [
      {
        id: 'core.file.open',
        title: 'Open',
        location: 'global/app',
        group: 'file',
        commandId: 'core.open',
        order: 10,
      },
      {
        id: 'extension.alpha.file.run',
        title: 'Run Alpha',
        location: 'global/app',
        group: 'file',
        commandId: 'extension.alpha.run',
        order: 20,
        ownerExtensionId: 'extension.alpha',
      },
      {
        id: 'context.visible.file',
        title: 'Visible on Desktop',
        location: 'global/app',
        group: 'file',
        commandId: 'context.visible',
        when: 'isDesktop',
        order: 30,
      },
      {
        id: 'context.hidden.file',
        title: 'Hidden on Desktop',
        location: 'global/app',
        group: 'file',
        commandId: 'context.hidden',
        when: 'isWeb',
        order: 40,
      },
      {
        id: 'native.edit.undo',
        title: 'Undo',
        location: 'global/app',
        group: 'edit',
        commandId: 'native.edit.undo',
        nativeRole: 'undo',
        when: 'isDesktop',
        order: 10,
      },
    ],
  }
}

test('web-rendered application menus include core and extension items in order', () => {
  const menus = resolveApplicationMenus(createRegistry(), {
    platform: 'web',
    os: 'unknown',
    placement: 'workbench/top-bar',
    isWeb: true,
  })

  assert.deepEqual(
    menus.find((menu) => menu.menuId === 'file').items.map((item) => item.label),
    ['Open', 'Run Alpha', 'Hidden on Desktop'],
  )
})

test('desktop native snapshot applies context-gated and native role items', () => {
  const snapshot = createDesktopNativeMenuSnapshot(createRegistry(), { os: 'macos' })
  const file = snapshot.menus.find((menu) => menu.menuId === 'file')
  const edit = snapshot.menus.find((menu) => menu.menuId === 'edit')

  assert.deepEqual(
    file.items.map((item) => item.label),
    ['Open', 'Run Alpha', 'Visible on Desktop'],
  )
  assert.equal(edit.items[0].nativeRole, 'undo')
})
