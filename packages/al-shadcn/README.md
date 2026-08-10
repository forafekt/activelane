# @activelane/shadcn

ActiveLane's next design-system foundation for Vue 3 productivity surfaces. It is built on shadcn-vue conventions, Reka UI primitives, Tailwind CSS 4, strict TypeScript, and a monochrome-first token system.

This package is intentionally independent from `@activelane/shadcn`. It is not a themed copy of the old package; it is the replacement foundation for the browser extension, future webapp, desktop app, and internal tools.

## Install

```ts
import '@activelane/shadcn/styles.css'
import { AlButton, AlSidepanelShell } from '@activelane/shadcn'
```

App styles should import the package CSS once, before app-specific overrides.

```css
@import "tailwindcss";
@import "@activelane/shadcn/styles.css";
@source "./**/*.{vue,ts}";
```

## Layers

- `components/ui`: shadcn-style primitives such as button, input, checkbox, tabs, dialog support, badges, cards, progress, and skeletons.
- `components/overlays`: accessible Reka-backed popovers, tooltips, dropdowns, context menus, dialogs, sheets, alert dialogs, and scroll areas.
- `components/forms`: field composition, search bars, inline rows, and settings forms.
- `components/layout`: app shells, workspaces, master/detail, split panes, toolbars, panel headers, inspectors, and document tabs.
- `components/navigation`: sidebars, rails, nav items, breadcrumbs, view switchers, and pagination.
- `components/data-display`: dense lists, selectable rows, tables, metadata, timelines, stat blocks, preview cards, loading states, and empty states.
- `components/sidepanel`: constrained-width list/detail shell, sticky headers, capture/document list rows, tree items, metadata rows, activity rows, and preview blocks.
- `components/command`: command bar and global command dialog for searchable action flows.

## Theme

Tokens live in `src/styles/tokens.css` and are exposed as CSS custom properties mapped into Tailwind 4 through `@theme inline`.

The palette is intentionally black, white, and gray first. Semantic tokens exist for destructive, warning, and success states only. App-level color accents should be rare and should extend semantic tokens, not bypass them with one-off color systems.

Supported theme modes:

- `light`
- `dark`
- `system`

Use `useTheme()` to sync the root class and `data-theme`.

```ts
import { useTheme } from '@activelane/shadcn'

const { mode, resolvedMode, setTheme } = useTheme()
setTheme('system')
```

## Architecture Principles

- Keep product domain logic out of the design system.
- Prefer Reka UI primitives for keyboard behavior, focus management, portals, dialogs, menus, and disclosure patterns.
- Use Tailwind utility composition against semantic tokens rather than app-local CSS hacks.
- Build shell and sidepanel patterns around slots so apps own data, routing, and commands.
- Keep markdown/editor persistence in `@activelane/editor`; this package only provides editor-adjacent chrome.
- Favor compact density, precise borders, restrained elevation, and stable layouts.

## Package vs App Boundary

Put reusable layout, navigation, command, overlay, form, and display patterns here.

Keep these in apps:

- capture save orchestration
- owner/workspace scoping
- repository calls
- extension APIs
- editor persistence and document serialization
- product-specific command handlers

## Migration From daisyUI

Migration should be incremental. Do not port daisyUI component names 1:1 unless the abstraction still earns its place. Start with shell primitives and sidepanel list/detail patterns, then replace lower-level controls as surfaces are touched.

Recommended first consumers:

1. Browser extension sidepanel shell/list/detail chrome.
2. Options dashboard settings forms and command palette.
3. Future webapp shell.
4. Workbench package shell primitives, if it remains host-neutral.

## Extension

New components should be added in the smallest layer that makes sense:

- primitive if it wraps a reusable accessibility or input behavior
- layout if it controls app structure
- sidepanel only if it specifically solves constrained-width productivity UI
- data-display if it renders generic information
- app-local if it needs ActiveLane business data

Avoid TODO components. If a pattern is not ready to be adopted, keep it out of package exports.
