import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createExtensionRuntime,
  createProtectionMetadata,
  createWorkbenchStore,
  verifyProtectionSecret,
} from '../dist/index.js'

const host = {
  mode: 'browser',
  capabilities: {},
}

function createMemoryStorage() {
  const namespaces = new Map()
  return {
    scope(namespace) {
      if (!namespaces.has(namespace)) namespaces.set(namespace, new Map())
      const values = namespaces.get(namespace)
      return {
        async get(key) {
          return values.get(key)
        },
        async set(key, value) {
          values.set(key, JSON.parse(JSON.stringify(value)))
        },
        async remove(key) {
          values.delete(key)
        },
      }
    },
  }
}

function createRuntimeHost(storage, notifications = []) {
  return {
    id: 'test-host',
    kind: 'webapp',
    label: 'Test Host',
    mode: 'standard',
    capabilities: {
      storage,
      notify: async (message) => {
        notifications.push(message)
      },
      clipboard: {
        async writeText(value) {
          notifications.push({ title: 'Clipboard', message: value })
        },
      },
    },
  }
}

test('workbench tabs normalize grouping, color, lock, and protection metadata', () => {
  const workbench = createWorkbenchStore(host, {
    layout: {
      kind: 'group',
      id: 'group:test',
      tabs: [
        {
          id: 'tab:one',
          kind: 'test',
          title: 'One',
          closable: true,
          pinned: false,
          preview: false,
          lifecycle: 'persistent',
          dirty: false,
          groupId: 'group:test',
        },
      ],
      activeTabId: 'tab:one',
    },
  })

  const tab = workbench.getActiveTab()
  assert.equal(tab.locked, false)
  assert.equal(tab.color, undefined)
  assert.equal(tab.tabGroupId, null)
  assert.equal(tab.protection, null)
  assert.deepEqual(workbench.state.layout.tabGroups, [])
})

test('locked tabs are skipped by direct and bulk close actions', () => {
  const workbench = createWorkbenchStore(host)
  const first = workbench.openTab({ kind: 'test', title: 'First', preview: false })
  const second = workbench.openTab({ kind: 'test', title: 'Second', preview: false })

  workbench.setTabLocked(first.id, true)
  workbench.closeTab(first.id)
  workbench.closeTabs([first.id, second.id])

  assert.deepEqual(
    workbench.state.layout.tabs.map((tab) => tab.id),
    [first.id],
  )
})

test('tab groups persist metadata and group close respects locked tabs', () => {
  const workbench = createWorkbenchStore(host)
  const first = workbench.openTab({ kind: 'test', title: 'First', preview: false })
  const second = workbench.openTab({ kind: 'test', title: 'Second', preview: false })
  const group = workbench.createTabGroup('Focus', undefined, [first.id, second.id])

  workbench.setTabGroupColor(group.id, 'green')
  workbench.setTabLocked(first.id, true)
  workbench.closeTabGroup(group.id)

  assert.equal(workbench.state.layout.tabGroups[0].name, 'Focus')
  assert.equal(workbench.state.layout.tabGroups[0].color, 'green')
  assert.deepEqual(
    workbench.state.layout.tabs.map((tab) => tab.id),
    [first.id],
  )
})

test('empty tab groups and reordered group metadata survive restore', () => {
  const workbench = createWorkbenchStore(host)
  const first = workbench.openTab({ kind: 'test', title: 'First', preview: false })
  const focus = workbench.createTabGroup('Focus', undefined, [first.id])
  const empty = workbench.createTabGroup('Empty')

  workbench.reorderTabGroup(empty.id, focus.id)
  const restored = createWorkbenchStore(host, workbench.state)

  assert.deepEqual(
    restored.state.layout.tabGroups.map((group) => group.name),
    ['Empty', 'Focus'],
  )
  assert.equal(restored.state.layout.tabs[0].tabGroupId, focus.id)
})

test('protected tabs require a session unlock for activation and destructive metadata changes', async () => {
  const workbench = createWorkbenchStore(host)
  const first = workbench.openTab({ kind: 'test', title: 'First', preview: false })
  const second = workbench.openTab({ kind: 'test', title: 'Second', preview: false })
  const protection = await createProtectionMetadata('1234', 'test hint')

  assert.equal(await verifyProtectionSecret(protection, 'wrong'), false)
  assert.equal(await verifyProtectionSecret(protection, '1234'), true)

  workbench.setTabProtection(first.id, protection)
  workbench.activateTab(second.id)
  workbench.activateTab(first.id)
  assert.equal(workbench.getActiveTab().id, second.id)

  workbench.openTab({ id: first.id, kind: 'test', title: 'Blocked Update', preview: false })
  assert.equal(first.title, 'First')

  workbench.unlockProtection(first.id)
  workbench.activateTab(first.id)
  workbench.openTab({ id: first.id, kind: 'test', title: 'Unlocked Update', preview: false })
  workbench.setTabTitle(first.id, 'Renamed Tab')
  workbench.setTabColor(first.id, 'blue')

  assert.equal(workbench.getActiveTab().id, first.id)
  assert.equal(first.title, 'Renamed Tab')
  assert.equal(first.color, 'blue')
  assert.equal(protection.hash === '1234', false)
  assert.equal('password' in protection, false)
  assert.equal('secret' in protection, false)
})

test('extension runtime tab actions mutate and restore the real persisted shell state', async () => {
  const storage = createMemoryStorage()
  const notifications = []
  const runtime = await createExtensionRuntime({
    host: createRuntimeHost(storage, notifications),
    runtimeId: 'tabs.integration',
  })

  const first = runtime.workbench.openTab({ kind: 'browser', title: 'Browser', preview: false })
  const second = runtime.workbench.openTab({
    kind: 'workbench.home',
    title: 'Home',
    preview: false,
  })
  const group = runtime.workbench.createTabGroup('Research', undefined, [first.id])
  runtime.workbench.renameTabGroup(group.id, 'Renamed')
  runtime.workbench.setTabColor(first.id, 'blue')
  runtime.workbench.setTabGroupColor(group.id, 'green')
  runtime.workbench.setTabLocked(first.id, true)
  runtime.workbench.setTabGroupCollapsed(group.id, true)
  runtime.workbench.closeTabs([first.id, second.id])
  await runtime.workbench.persist()

  assert.deepEqual(
    runtime.workbench.state.layout.tabs.map((tab) => tab.id),
    [first.id],
  )
  assert.equal(runtime.workbench.state.layout.tabs[0].color, 'blue')
  assert.equal(runtime.workbench.state.layout.tabGroups[0].name, 'Renamed')
  assert.equal(runtime.workbench.state.layout.tabGroups[0].color, 'green')
  assert.equal(runtime.workbench.state.layout.tabGroups[0].collapsed, true)

  const restored = await createExtensionRuntime({
    host: createRuntimeHost(storage),
    runtimeId: 'tabs.integration',
  })

  assert.equal(restored.workbench.state.layout.tabs[0].id, first.id)
  assert.equal(restored.workbench.state.layout.tabs[0].locked, true)
  assert.equal(restored.workbench.state.layout.tabs[0].color, 'blue')
  assert.equal(restored.workbench.state.layout.tabGroups[0].name, 'Renamed')
  assert.equal(restored.workbench.state.layout.tabGroups[0].collapsed, true)
})
