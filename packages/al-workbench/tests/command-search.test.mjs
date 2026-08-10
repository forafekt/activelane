import assert from 'node:assert/strict'
import test from 'node:test'
import { createCommandSearchService } from '../src/core/workbench/commands.ts'

function createRegistry() {
  return {
    parts: [],
    statusBar: [],
    globalMenus: [],
    activityRail: [],
    apps: [],
    sidebarViews: [],
    commands: [],
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

function createService(registry, onExecute = async () => {}) {
  const settings = new Map()
  return {
    service: createCommandSearchService({
      registry,
      settings: {
        get(id, fallback) {
          return settings.has(id) ? settings.get(id) : fallback
        },
      },
      extensions: {
        getRecord(extensionId) {
          return extensionId === 'extension.alpha'
            ? { manifest: { displayName: 'Alpha Extension' }, enabled: true }
            : undefined
        },
      },
      execute: onExecute,
    }),
    settings,
  }
}

test('command search discovers registered commands without hard-coded palette entries', () => {
  const registry = createRegistry()
  registry.commands.push({
    id: 'test.sayHello',
    title: 'Say Hello',
    category: 'Tests',
    run: async () => {},
  })

  const { service } = createService(registry)
  assert.equal(service.search('hello').at(0)?.commandId, 'test.sayHello')
})

test('command search removes unregistered commands reactively', () => {
  const registry = createRegistry()
  registry.commands.push({
    id: 'test.removeMe',
    title: 'Remove Me',
    run: async () => {},
  })
  const { service } = createService(registry)

  assert.equal(service.search('remove').length, 1)
  registry.commands.splice(0, registry.commands.length)
  assert.equal(service.search('remove').length, 0)
})

test('command search filters, ranks, and deduplicates palette aliases by command id', () => {
  const registry = createRegistry()
  registry.commands.push({
    id: 'extension.alpha.openPanel',
    title: 'Open Alpha Panel',
    ownerExtensionId: 'extension.alpha',
    run: async () => {},
  })
  registry.commandPalette.push(
    {
      id: 'alpha.primary',
      title: 'Alpha: Open Panel',
      commandId: 'extension.alpha.openPanel',
      keywords: ['remote', 'agent'],
      category: 'Extensions',
    },
    {
      id: 'alpha.duplicate',
      title: 'Duplicate Alpha Alias',
      commandId: 'extension.alpha.openPanel',
    },
  )

  const { service } = createService(registry)
  const results = service.search('agent')
  assert.equal(results.length, 1)
  assert.equal(results[0].title, 'Alpha: Open Panel')
})

test('command execution respects hidden, disabled, and available extension commands', async () => {
  const registry = createRegistry()
  const executed = []
  registry.commands.push(
    {
      id: 'extension.alpha.run',
      title: 'Run Alpha',
      ownerExtensionId: 'extension.alpha',
      run: async () => {},
    },
    {
      id: 'extension.alpha.disabled',
      title: 'Disabled Alpha',
      enabled: false,
      run: async () => {},
    },
    {
      id: 'extension.alpha.hidden',
      title: 'Hidden Alpha',
      visible: false,
      run: async () => {},
    },
  )
  const { service } = createService(registry, async (commandId) => {
    executed.push(commandId)
  })

  assert.equal(service.search('alpha').length, 1)
  assert.equal(await service.execute('extension.alpha.run'), true)
  assert.equal(await service.execute('extension.alpha.disabled'), false)
  assert.deepEqual(executed, ['extension.alpha.run'])
})

test('command search exposes keybinding overrides and recent commands', async () => {
  const registry = createRegistry()
  registry.commands.push({
    id: 'test.shortcut',
    title: 'Shortcut Command',
    shortcut: 'Mod+K',
    secondaryShortcuts: ['Mod+Shift+P'],
    run: async () => {},
  })
  const { service, settings } = createService(registry)
  settings.set('keybindings.test.shortcut', 'Ctrl+Alt+K')

  assert.deepEqual(service.get('test.shortcut')?.shortcut, ['Ctrl+Alt+K', 'Mod+Shift+P'])
  assert.equal(await service.execute('test.shortcut'), true)
  assert.equal(service.getRecent().at(0)?.commandId, 'test.shortcut')
})
