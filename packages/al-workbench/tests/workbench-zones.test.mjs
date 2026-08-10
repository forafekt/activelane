import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveStatusBarItems,
  resolveWorkbenchZoneContributions,
} from '../src/core/workbench/zones.ts'

function createRegistry() {
  return {
    parts: [],
    statusBar: [
      {
        id: 'status.right',
        title: 'Right',
        alignment: 'right',
        order: 20,
      },
      {
        id: 'status.left.second',
        title: 'Second',
        alignment: 'left',
        order: 20,
      },
      {
        id: 'status.left.first',
        title: 'First',
        alignment: 'left',
        order: 10,
        commandId: 'demo.first',
      },
      {
        id: 'status.hidden',
        title: 'Hidden',
        visible: false,
        order: 5,
      },
      {
        id: 'status.desktop',
        title: 'Desktop',
        when: 'isDesktop',
        order: 1,
      },
      {
        id: 'status.missing-command',
        title: 'Missing Command',
        commandId: 'demo.missing',
        order: 30,
      },
    ],
    globalMenus: [],
    activityRail: [
      { id: 'activity.beta', title: 'Beta', order: 20 },
      { id: 'activity.alpha', title: 'Alpha', order: 10 },
    ],
    apps: [],
    sidebarViews: [],
    commands: [{ id: 'demo.first', title: 'First Command' }],
    commandPalette: [],
    tabRenderers: [],
    tabSurfaces: [],
    tabToolbarActions: [],
    tabContextMenu: [],
    bottomPaneViews: [],
    inspectorPanels: [],
    settingsPages: [],
    menus: [],
  }
}

test('status bar contributions resolve defaults, visibility, and ordering', () => {
  const items = resolveStatusBarItems(createRegistry(), { platform: 'webapp' })

  assert.deepEqual(
    items.map((item) => item.id),
    ['status.left.first', 'status.left.second', 'status.missing-command', 'status.right'],
  )
  assert.equal(items[0].alignment, 'left')
  assert.equal(items[0].label, 'First')
  assert.equal(items.find((item) => item.id === 'status.right')?.alignment, 'right')
})

test('status bar resolver keeps invalid command references non-fatal', () => {
  const items = resolveStatusBarItems(createRegistry())

  assert.equal(
    items.some((item) => item.id === 'status.missing-command'),
    true,
  )
})

test('zone lookup returns expected registered contributions', () => {
  const items = resolveWorkbenchZoneContributions(createRegistry(), 'workbench.activityRail')

  assert.deepEqual(
    items.map((item) => item.id),
    ['activity.alpha', 'activity.beta'],
  )
})
