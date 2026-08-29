# ActiveLane Docking Layout

A Vue 3 + TypeScript workbench layout engine. Runtime pane definitions and components live in `PaneRegistry`; the versioned layout document contains only serializable pane instances and split-tree state. Each `LayoutRoot` owns its interaction controller, injection scope, listeners, overlays, and persistence boundary, so independent instances do not share state.

## Ownership and invariants

`LayoutStore` is the sole model owner. Components request typed operations and never edit the tree. Every outer transaction snapshots the document, simplifies empty/single-child structures, clears dangling fullscreen references, validates node and pane identity, then commits one change event; an exception restores the snapshot. Splits always have matching positive normalized weights, groups have a local active tab or `null`, and a pane ID may occur only once.

The interaction controller is an explicit `idle → pressed → dragging → dropping` state machine, with `cancelled → idle` for aborted gestures. A press remains a click until six CSS pixels of movement. Pointer capture plus centralized listeners cover release, cancellation, lost capture, blur, Escape, and unmount. Native HTML drag-and-drop is not used. Close/menu descendants carry a no-drag boundary.

## Run

```bash
npm install
npm run dev
```

Production validation from the monorepo root:

```bash
pnpm --filter @activelane/docking-layout test
pnpm --filter @activelane/docking-layout typecheck
pnpm --filter @activelane/docking-layout build
```

## Included features

- Recursive row/column split tree with nested tab groups
- Separate pane definitions (runtime registry) and pane instances (serializable state)
- Pointer-based tab and whole-group dragging; left/right/top/bottom/center docking
- Live docking preview and tab merging; keyboard tab reorder (`Alt+Arrow`)
- Pointer and keyboard resizing; double-click equalize; minimum/maximum sizing
- Intersection handles for simultaneous horizontal/vertical resize where nested splitters meet
- Add, close, reopen and permanently dispose APIs
- Collapse is distinct from close; four edge drawers support hover preview and click-to-open
- Group fullscreen/maximize; `Escape` exits and `Ctrl/Cmd+W` closes the active pane
- Context-menu action model separated from menu rendering
- Versioned JSON persistence with automatic local-storage saving
- Begin/commit/rollback transactions and strongly typed layout events
- Pane lifecycle callbacks: create, open, close, activate and dispose
- Resource identity and `reuse`, `reveal`, or `new` open policies
- Semantic `primary`, `secondary`, `panel`, `sidebar`, and `auxiliary` locations
- Named resize snapshots, equalize and restore
- Extension-friendly pane registry with disposable registrations
- CSS design tokens; dynamic geometry is passed only through CSS custom properties
- Runnable responsive demo with Explorer, editors, Terminal, and Inspector

## Architecture

```text
PaneRegistry (non-serializable definitions/components)
                   ↓ creates
PaneInstance[] inside PaneGroupNode
                   ↓ nested by
SplitNode[] (row/column, percentage sizes)
                   ↓ mutated by
LayoutStore (transactions, events, persistence, lifecycle)
                   ↓ rendered by
LayoutRoot → LayoutNode → SplitNode / PaneGroup
```

## Basic integration

```ts
import { markRaw } from 'vue'
import { LayoutStore, PaneRegistry, group, split } from './layout'
import EditorPane from './EditorPane.vue'

const registry = new PaneRegistry()
registry.register({
  type: 'editor',
  title: 'Editor',
  component: markRaw(EditorPane),
  allowMultiple: true,
  defaultLocation: 'primary',
  onOpen: pane => console.log('opened', pane.resourceId),
})

const first = registry.create('editor', { resourceId: 'src/main.ts' })
const root = split('row', [group([first], { location: 'primary' })])
const store = new LayoutStore({ root, registry, storageKey: 'my-layout-v1' })
```

```vue
<template><LayoutRoot :store="store" /></template>
```

Open resources with identity-aware policies:

```ts
store.open('editor', { resourceId: 'src/main.ts', policy: 'reuse' })
store.open('editor', { resourceId: 'src/main.ts', policy: 'new' })
```

## Store API highlights

| Area | Methods |
|---|---|
| panes | `open`, `findPane`, `closePane`, `reopen`, `hidePane`, `show`, `dispose`, `activate`, `reorder` |
| layout | `dock`, `collapse`, `expand`, `toggleFullscreen`, `reset` |
| sizing | `setSizes`, `equalize`, `saveResizeSnapshot`, `restoreResizeSnapshot` |
| state | `serialize`, `restore`, `save`, `load`, `snapshot`, `readonly`, `validate` |
| extensions | `registry.register`, `registry.unregister`, `registry.create` |
| events | `events.on('change' | 'transaction' | 'paneOpen' | ...)` |

`store.transaction(name, callback)` groups mutations and rolls the full document back if the callback throws. Version 1 documents migrate to version 2 by adding the distinct hidden-pane collection. Unknown versions and invalid trees are rejected before state changes.

## Lifecycle and semantics

- `closePane` removes a visible pane into the reopen history and invokes `onClose`.
- `hidePane` removes it into a separate hidden collection and invokes `onHide`; `show` reveals it.
- `collapse` removes a complete group into an edge drawer without closing its panes; `expand` docks it back deterministically by semantic location.
- `dispose` permanently removes a visible, closed, or hidden pane and invokes `onDispose`.
- `toggleFullscreen` changes presentation only and is cleared automatically if its group disappears.

Definitions may provide `onCreate`, `onOpen`, `onClose`, `onHide`, `onActivate`, and `onDispose`. Registration returns a scoped disposer that cannot accidentally unregister a later definition with the same type.

## Extension and workbench integration

Extensions register definitions at activation and call the returned disposer at deactivation. Instances identify resources with `resourceId`, or definitions can derive identity through `resourceKey`. `reuse`/`reveal` activate an existing resource while `new` creates another instance. Semantic locations (`sidebar`, `primary`, `secondary`, `panel`, `auxiliary`) keep placement independent from tree position.

ActiveLane integrates the engine at `WorkbenchLayout`: sidebar, contributed tab workspace, inspector, and bottom panel are generic registered pane types. Their content continues to resolve commands, menus, icons, context keys, extension views, and lifecycle through the existing injected workbench runtime; the docking package has no ActiveLane-specific dependency.

## Keyboard, accessibility, and theming

Tabs use tablist/tab semantics, roving focus, Enter/Space activation, and `Alt+Arrow` reordering. Separators expose orientation and current percentage, accept arrow keys (Shift for larger steps), and equalize on double click. Escape cancels a drag or exits fullscreen. CSS is scoped under `.dock-layout`; geometry is communicated through `--dock-columns`, `--dock-rows`, and pointer-position variables. Override the `--dock-*` tokens, including surface, text, line, accent, handle, and header dimensions. Focus-visible, reduced-motion, overflow, and high-contrast-friendly borders are included.

## Deliberate limitation

Pane component-local state is not serialized. Persistent pane state belongs in the host application or in JSON-safe `PaneInstance.props`; Vue components, functions, and reactive objects are intentionally rejected from the persistence boundary.

## Notes for production use

- Pane component state that must survive unmounting should live in your application store or in `PaneInstance.props` if it is JSON-safe.
- Persistence is versioned. Add a migration before increasing the current version.
- The demo uses Unicode glyphs to stay asset-free; replace them with your icon component through the pane definition or header rendering.
- The core intentionally has no global singleton. Multiple independent layouts may be mounted on one page.
- The layout owns tab/group drag interactions. Content-level drag-and-drop can coexist by stopping pointer propagation from its own drag handles and using application-specific transfer payloads.

## Source map

```text
src/layout/
├── components/     recursive rendering and interaction views
├── composables/    injected layout access
├── core/           model, store, registry, events, tree and drag controller
├── styles/         tokens, layout, pane and drag styles
└── index.ts        public package exports
```
