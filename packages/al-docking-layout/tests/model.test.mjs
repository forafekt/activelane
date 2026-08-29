import assert from 'node:assert/strict'
import test from 'node:test'
import { defineComponent } from 'vue'
import { DragController } from '../src/layout/core/drag.ts'
import { PaneRegistry } from '../src/layout/core/registry.ts'
import { LayoutStore } from '../src/layout/core/store.ts'
import {
  constrainBoundary,
  findNode,
  group,
  groups,
  normalizeSizes,
  split,
} from '../src/layout/core/tree.ts'
import { validateTree } from '../src/layout/core/validation.ts'

function fixture() {
  const registry = new PaneRegistry()
  registry.register({ type: 'test', title: 'Test', component: defineComponent({}) })
  const panes = ['a', 'b', 'c', 'd'].map((id) => registry.create('test', { id, resourceId: id }))
  const root = split(
    'row',
    [
      group(panes.slice(0, 3), { id: 'left', location: 'primary', header: { visible: false } }),
      group([panes[3]], {
        id: 'right',
        location: 'secondary',
        header: { visible: true, title: 'Right' },
      }),
    ],
    [60, 40],
    'root',
  )
  return { registry, panes, store: new LayoutStore({ root, registry }) }
}

const ids = (store, groupId) => findNode(store.state.root, groupId)?.tabs.map((pane) => pane.id)

test('normalizes sizes and constrains a boundary', () => {
  assert.deepEqual(normalizeSizes([2, 1, Number.NaN]).map(Math.round), [50, 25, 25])
  assert.deepEqual(constrainBoundary([50, 50], 0, -80, 1000, 200, 200).map(Math.round), [20, 80])
})

test('reorders first to last, last to first, and middle to middle using stable IDs', () => {
  const { store } = fixture()
  store.reorder('left', 'a', 3)
  assert.deepEqual(ids(store, 'left'), ['b', 'c', 'a'])
  store.reorder('left', 'a', 0)
  assert.deepEqual(ids(store, 'left'), ['a', 'b', 'c'])
  store.reorder('left', 'b', 1)
  assert.deepEqual(ids(store, 'left'), ['a', 'b', 'c'])
})

test('reorder preserves active and inactive selection and self drop is stable', () => {
  const { store } = fixture()
  store.activate('left', 'b')
  store.reorder('left', 'b', 0)
  assert.equal(findNode(store.state.root, 'left').activeTabId, 'b')
  store.reorder('left', 'c', 1)
  assert.equal(findNode(store.state.root, 'left').activeTabId, 'b')
  assert.equal(store.dock('left', 'b', 'left', 'center'), false)
  assert.equal(store.dock('left', 'b', 'left', 'center', 1), true)
  assert.deepEqual(ids(store, 'left'), ['b', 'c', 'a'])
})

test('tab-strip insertion moves an existing tab within and across groups', () => {
  const { store, panes } = fixture()
  const identity = panes[1]
  store.moveTab('left', 'b', 'left', 0)
  assert.deepEqual(ids(store, 'left'), ['b', 'a', 'c'])
  store.moveTab('left', 'b', 'right', 0)
  assert.deepEqual(ids(store, 'right'), ['b', 'd'])
  assert.equal(findNode(store.state.root, 'right').tabs[0].resourceId, identity.resourceId)
})

test('moving the final tab removes an empty group but hidden tabs keep it alive', () => {
  const { store } = fixture()
  store.hidePane('d')
  store.moveTab('right', 'd', 'left', 0)
  assert.equal(findNode(store.state.root, 'right'), undefined)
  const next = fixture().store
  next.hidePane('a')
  next.hidePane('b')
  next.moveTab('left', 'c', 'right', 0)
  assert.ok(findNode(next.state.root, 'left'))
  assert.deepEqual(findNode(next.state.root, 'left').hiddenTabIds.sort(), ['a', 'b'])
})

test('hide keeps tab in its group and chooses nearest visible active sibling', () => {
  const { store } = fixture()
  store.activate('left', 'b')
  store.hidePane('b')
  const left = findNode(store.state.root, 'left')
  assert.deepEqual(
    left.tabs.map((pane) => pane.id),
    ['a', 'b', 'c'],
  )
  assert.deepEqual(left.hiddenTabIds, ['b'])
  assert.equal(left.activeTabId, 'c')
  assert.equal(store.show('b').id, 'b')
  assert.equal(left.activeTabId, 'b')
})

test('close, hide, and dispose remain distinct', () => {
  const { store } = fixture()
  store.hidePane('a')
  assert.equal(store.state.closed.length, 0)
  store.closePane('b')
  assert.equal(store.state.closed[0].pane.id, 'b')
  store.dispose('a')
  assert.equal(
    findNode(store.state.root, 'left').tabs.some((pane) => pane.id === 'a'),
    false,
  )
})

test('moves and merges whole groups containing visible and hidden tabs', () => {
  const { store } = fixture()
  store.hidePane('b')
  assert.equal(store.moveGroup('left', 'right', 'bottom'), true)
  assert.equal(findNode(store.state.root, 'left').hiddenTabIds[0], 'b')
  assert.equal(store.moveGroup('left', 'right', 'center'), true)
  assert.deepEqual(ids(store, 'right'), ['d', 'a', 'b', 'c'])
  assert.deepEqual(findNode(store.state.root, 'right').hiddenTabIds, ['b'])
})

test('pane movement supports every edge, nested targets, and rejects self-drop', () => {
  for (const position of ['left', 'right', 'top', 'bottom']) {
    const { store } = fixture()
    assert.equal(store.moveGroup('left', 'right', position), true)
    assert.deepEqual(store.validate(), [])
  }
  const { store } = fixture()
  assert.equal(store.moveGroup('left', 'left', 'right'), false)
})

test('hide/show pane, collapse/expand, and fullscreen preserve tree state', () => {
  const { store } = fixture()
  const before = JSON.stringify(store.state.root)
  store.toggleFullscreen('left')
  assert.equal(JSON.stringify(store.state.root), before)
  store.toggleFullscreen('left')
  store.hideGroup('right')
  assert.equal(store.state.hiddenGroups[0].group.id, 'right')
  store.showGroup('right')
  store.collapse('right', 'right')
  store.expand('right')
  assert.deepEqual(store.validate(), [])
})

test('tab order, visibility, pane metadata, and position survive persistence', () => {
  const { store, registry } = fixture()
  store.reorder('left', 'c', 0)
  store.hidePane('b')
  store.moveGroup('right', 'left', 'bottom')
  const restored = new LayoutStore({ root: group([]), registry })
  restored.restore(store.serialize())
  assert.equal(restored.state.version, 3)
  assert.deepEqual(restored.validate(), [])
  assert.deepEqual(
    groups(restored.state.root).flatMap((item) => item.hiddenTabIds),
    ['b'],
  )
  assert.equal(findNode(restored.state.root, 'right').header.title, 'Right')
})

test('migrates v2 removed-hidden records back into owning groups as hidden IDs', () => {
  const { store } = fixture()
  const legacy = JSON.parse(store.serialize())
  const left = findNode(legacy.root, 'left')
  const pane = left.tabs.splice(1, 1)[0]
  legacy.version = 2
  legacy.hidden = [{ pane, previousGroupId: 'left', previousLocation: 'primary' }]
  delete legacy.hiddenGroups
  store.restore(legacy)
  assert.equal(store.state.version, 3)
  assert.ok(findNode(store.state.root, 'left').tabs.some((tab) => tab.id === pane.id))
  assert.ok(findNode(store.state.root, 'left').hiddenTabIds.includes(pane.id))
})

test('failed pane transaction rolls back without duplicate or lost identities', () => {
  const { store } = fixture()
  const before = store.serialize()
  assert.throws(() =>
    store.transaction('fail', () => {
      store.state.root = group([], { id: 'broken' })
      throw new Error('nope')
    }),
  )
  assert.equal(store.serialize(), before)
  assert.deepEqual(validateTree(store.state.root), [])
})

test('resource policies and snapshots preserve logical identity and geometry', () => {
  const { store } = fixture()
  assert.equal(store.open('test', { resourceId: 'a', policy: 'reuse' }).id, 'a')
  assert.notEqual(store.open('test', { resourceId: 'a', policy: 'new' }).id, 'a')
  store.saveResizeSnapshot('before')
  const root = store.state.root
  store.setSizes(root.id, [10, 90])
  assert.equal(store.restoreResizeSnapshot(store.state.snapshots[0].id), true)
})

test('drag threshold, cancel, release, and repeated drags return to idle', async () => {
  class FakeElement extends EventTarget {
    captured = false
    setPointerCapture() {
      this.captured = true
    }
    hasPointerCapture() {
      return this.captured
    }
    releasePointerCapture() {
      this.captured = false
    }
  }
  class FakePointerEvent extends Event {
    constructor(type, init) {
      super(type)
      for (const [key, value] of Object.entries(init))
        if (key !== 'currentTarget') Object.defineProperty(this, key, { value, configurable: true })
    }
  }
  const fakeWindow = new EventTarget()
  globalThis.window = fakeWindow
  globalThis.HTMLElement = FakeElement
  const source = new FakeElement()
  const drag = new DragController(6)
  const down = new FakePointerEvent('pointerdown', {
    button: 0,
    pointerId: 1,
    clientX: 10,
    clientY: 10,
  })
  Object.defineProperty(down, 'currentTarget', { value: source })
  drag.press(down, { kind: 'tab', groupId: 'left', paneId: 'a' }, () => {})
  fakeWindow.dispatchEvent(
    new FakePointerEvent('pointermove', { pointerId: 1, clientX: 13, clientY: 13 }),
  )
  assert.equal(drag.state.phase, 'pressed')
  fakeWindow.dispatchEvent(
    new FakePointerEvent('pointermove', { pointerId: 1, clientX: 30, clientY: 30 }),
  )
  assert.equal(drag.state.phase, 'dragging')
  fakeWindow.dispatchEvent(new FakePointerEvent('pointercancel', { pointerId: 1 }))
  await Promise.resolve()
  assert.equal(drag.state.phase, 'idle')
  drag.press(down, { kind: 'tab', groupId: 'left', paneId: 'a' }, () => {})
  fakeWindow.dispatchEvent(new FakePointerEvent('pointerup', { pointerId: 1 }))
  assert.equal(drag.state.phase, 'idle')
})
