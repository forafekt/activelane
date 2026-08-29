<script setup lang="ts">
import { markRaw, ref } from 'vue'
import EditorPane from './demo/EditorPane.vue'
import ExplorerPane from './demo/ExplorerPane.vue'
import InspectorPane from './demo/InspectorPane.vue'
import TerminalPane from './demo/TerminalPane.vue'
import { group, type LayoutNode, LayoutRoot, LayoutStore, PaneRegistry, split } from './layout'

const registry = new PaneRegistry()
registry.register({
  type: 'explorer',
  title: 'Explorer',
  icon: '◇',
  component: markRaw(ExplorerPane),
  allowMultiple: false,
  defaultLocation: 'sidebar',
  defaultMinSize: 170,
})
registry.register({
  type: 'editor',
  title: 'Editor',
  icon: '⌘',
  component: markRaw(EditorPane),
  allowMultiple: true,
  defaultLocation: 'primary',
})
registry.register({
  type: 'terminal',
  title: 'Terminal',
  icon: '›_',
  component: markRaw(TerminalPane),
  allowMultiple: true,
  defaultLocation: 'panel',
})
registry.register({
  type: 'inspector',
  title: 'Inspector',
  icon: '◎',
  component: markRaw(InspectorPane),
  allowMultiple: false,
  defaultLocation: 'secondary',
})

function initialLayout(): LayoutNode {
  const explorer = registry.create('explorer', { id: 'pane-explorer', title: 'Explorer' })
  const editorA = registry.create('editor', {
    id: 'pane-editor-a',
    title: 'App.vue',
    resourceId: 'src/App.vue',
  })
  const editorB = registry.create('editor', {
    id: 'pane-editor-b',
    title: 'layout-store.ts',
    resourceId: 'src/layout/core/store.ts',
  })
  const inspector = registry.create('inspector', { id: 'pane-inspector', title: 'Inspector' })
  const terminal = registry.create('terminal', { id: 'pane-terminal', title: 'Terminal' })
  return split(
    'column',
    [
      split(
        'row',
        [
          group([explorer], {
            id: 'group-explorer',
            location: 'sidebar',
            minSize: 170,
            maxSize: 420,
            header: { visible: true, title: 'Explorer', fullscreen: true, close: true },
            tabs: [explorer],
          }),
          group([editorA, editorB], {
            id: 'group-editor',
            activeTabId: editorA.id,
            location: 'primary',
            minSize: 260,
            header: { visible: false },
          }),
          group([inspector], {
            id: 'group-inspector',
            location: 'secondary',
            minSize: 180,
            header: { visible: true, title: 'Inspector', fullscreen: true, close: true },
          }),
        ],
        [19, 56, 25],
        'split-content',
      ),
      group([terminal], {
        id: 'group-terminal',
        location: 'panel',
        minSize: 100,
        maxSize: 500,
        header: { visible: true, title: 'Terminal', fullscreen: true, close: true },
      }),
    ],
    [72, 28],
  )
}
const rootTemplate = initialLayout()
const store = new LayoutStore({ root: rootTemplate, registry, storageKey: 'vue-docking-demo-v3' })
try {
  store.load()
} catch {
  localStorage.removeItem('vue-docking-demo-v3')
}
const lastEvent = ref('Ready')
const interaction = ref('idle')
store.events.on('change', (event) => (lastEvent.value = event.reason))
function addEditor() {
  const number =
    store.visibleGroups.value.flatMap((item) => item.tabs).filter((item) => item.type === 'editor')
      .length + 1
  store.open('editor', {
    title: `untitled-${number}.ts`,
    resourceId: `untitled:${number}`,
    policy: 'new',
  })
}
function exportLayout() {
  navigator.clipboard?.writeText(store.serialize())
  lastEvent.value = 'Layout JSON copied'
}
function validateLayout() {
  const issues = store.validate()
  lastEvent.value = issues.length
    ? issues.map((issue) => issue.message).join('; ')
    : 'Layout is valid'
}
</script>

<template>
  <div class="app-shell">
    <header class="app-bar">
      <div class="brand">
        <span class="brand-mark">D</span>
        <div><strong>Dockspace</strong><small>Vue 3 modular layout</small></div>
      </div>
      <nav>
        <button type="button" @click="addEditor">＋ Add pane</button
        ><button type="button" :disabled="!store.state.closed.length" @click="store.reopen()">
          ↶ Reopen
        </button><button
          type="button"
          @click="store.saveResizeSnapshot(`Snapshot ${store.state.snapshots.length + 1}`)"
        >
          ◈ Snapshot
        </button><button
          type="button"
          v-if="store.state.snapshots[0]"
          @click="store.restoreResizeSnapshot(store.state.snapshots[0].id)"
        >
          ↺ Restore sizes
        </button><button type="button" @click="exportLayout">{ } Copy layout</button
        ><button type="button" @click="validateLayout">✓ Validate</button
        ><button
          v-if="store.state.hiddenGroups[0]"
          type="button"
          @click="store.showGroup(store.state.hiddenGroups[0].group.id)"
        >
          Show pane
        </button><button type="button" @click="store.reset(rootTemplate)">Reset</button>
      </nav>
      <span class="event-pill">{{ lastEvent }}</span>
    </header>
    <main class="workspace"><LayoutRoot :store="store" @interaction="interaction = $event" /></main>
    <footer>
      <span>Drag tabs or pane headers • right-click a tab • Alt+←/→ reorders tabs</span
      ><span
        >{{ store.visibleGroups.value.length }}
        groups · {{ store.state.closed.length }} closed ·
        {{ store.state.collapsed.length }}
        collapsed · interaction: {{ interaction }}</span
      >
    </footer>
  </div>
</template>
