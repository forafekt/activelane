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
      { id: 'core.newWindow', title: 'New Window', shortcut: '  Mod+Shift+N  ' },
      { id: 'core.noShortcut', title: 'No Shortcut', shortcut: '' },
      { id: 'extension.alpha.run', title: 'Alpha: Run' },
      { id: 'extension.beta.run', title: 'Beta: Run', shortcut: '' },
      { id: 'context.visible', title: 'Context Visible' },
      { id: 'context.hidden', title: 'Context Hidden' },
    ],
    commandPalette: [],
    tabRenderers: [],
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
        id: 'extension.beta.file.run',
        title: 'Run Beta',
        location: 'global/app',
        group: 'file',
        commandId: 'extension.beta.run',
        order: 25,
        ownerExtensionId: 'extension.beta',
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
        id: 'core.file.newWindow',
        title: 'New Window',
        location: 'global/app',
        group: 'file',
        commandId: 'core.newWindow',
        order: 50,
      },
      {
        id: 'core.file.noShortcut',
        title: 'No Shortcut',
        location: 'global/app',
        group: 'file',
        commandId: 'core.noShortcut',
        order: 60,
      },
      {
        id: 'core.file.separator',
        title: 'File Separator',
        kind: 'separator',
        location: 'global/app',
        group: 'file',
        order: 70,
      },
      {
        id: 'core.file.submenu',
        title: 'More',
        kind: 'submenu',
        location: 'global/app',
        group: 'file',
        submenu: 'file.more',
        order: 80,
      },
      {
        id: 'core.file.more.noShortcut',
        title: 'Nested No Shortcut',
        location: 'global/app',
        menuId: 'file.more',
        commandId: 'core.noShortcut',
        order: 10,
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
    menus
      .find((menu) => menu.menuId === 'file')
      .items.filter((item) => item.kind !== 'separator')
      .map((item) => item.label),
    ['Open', 'Run Alpha', 'Run Beta', 'Hidden on Desktop', 'New Window', 'No Shortcut', 'More'],
  )
})

test('desktop native snapshot applies context-gated and native role items', () => {
  const snapshot = createDesktopNativeMenuSnapshot(createRegistry(), { os: 'macos' })
  const file = snapshot.menus.find((menu) => menu.menuId === 'file')
  const edit = snapshot.menus.find((menu) => menu.menuId === 'edit')

  assert.deepEqual(
    file.items.filter((item) => item.kind !== 'separator').map((item) => item.label),
    ['Open', 'Run Alpha', 'Run Beta', 'Visible on Desktop', 'New Window', 'No Shortcut', 'More'],
  )
  assert.equal(edit.items[0].nativeRole, 'undo')
})

test('desktop native snapshot omits missing or blank shortcuts', () => {
  const snapshot = createDesktopNativeMenuSnapshot(createRegistry(), { os: 'macos' })
  const file = snapshot.menus.find((menu) => menu.menuId === 'file')
  const byLabel = new Map(file.items.map((item) => [item.label, item]))

  assert.equal(byLabel.get('Open').shortcut, 'Mod+O')
  assert.equal(byLabel.get('New Window').shortcut, 'Mod+Shift+N')
  assert.equal(Object.hasOwn(byLabel.get('Run Alpha'), 'shortcut'), false)
  assert.equal(Object.hasOwn(byLabel.get('Run Beta'), 'shortcut'), false)
  assert.equal(Object.hasOwn(byLabel.get('No Shortcut'), 'shortcut'), false)

  const submenu = byLabel.get('More')
  assert.equal(submenu.kind, 'submenu')
  assert.equal(Object.hasOwn(submenu.items[0], 'shortcut'), false)
})
