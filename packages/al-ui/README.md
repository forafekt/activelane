# @activelane/ui

ActiveLane's compact Vue design system. It owns the public component contract, semantic theme tokens, density, providers, services, reusable blocks, and registry catalog. Naive UI is the principal implementation; consumers use ActiveLane names and do not need to import it directly.

The dependency boundary is `@activelane/icons → @activelane/ui → @activelane/workbench → applications/extensions`. This package never imports the workbench, Shadcn, Wails, or extension-runtime code. Workbench shell geometry remains owned by `@activelane/workbench`.

## Install and configure

```sh
pnpm add @activelane/ui vue
```

```ts
import { createApp } from 'vue'
import { UiProvider } from '@activelane/ui'
import '@activelane/ui/styles.css'
```

Wrap each application or isolated extension root:

```vue
<UiProvider theme="system" density="compact" :reduced-motion="'system'">
  <App />
</UiProvider>
```

`UiProvider` composes configuration, loading-bar, dialog, modal, notification, and message providers. It accepts ActiveLane presets or a custom `UiThemePreset`, Naive locales through the vendor-neutral `Locale`/`DateLocale` types, compact or comfortable density, system color preference, high contrast, and reduced motion. Styles are scoped below `.al-ui-root`; no body reset is installed, which keeps browser-extension, Wails, shadow-root, and webview hosts safe.

## Components and types

```ts
import { Button, DataTable, Form, FormItem, Input, Tree } from '@activelane/ui'
import type { DataTableColumns, FormRules, TreeOption } from '@activelane/ui'
```

The inventory covers layout/general (affix, back-top, button/group, typography, divider, flex/grid/space, layout, scrollbar), forms (form/item, input/group/number/OTP, select, auto-complete, cascader, checkbox/radio groups, switch, slider, rate, color/date/time pickers, calendar, dynamic input/tags, transfer, tree-select, mention, upload), data display (tables, virtual/infinite lists, tree/list/descriptions, statistic/animation, timeline, tags/badges/avatars, image/preview, ellipsis, empty/result/progress/countdown, QR/equation/code/log/heatmap), navigation (menu/dropdown, tabs, breadcrumb, steps, pagination, anchor, back-top, page header), feedback/overlays (alert, dialog, modal, drawer, popover/confirm/select, tooltip, provider services, spinner/skeleton/progress), and surfaces (card, collapse, carousel, split).

Thin adapters intentionally retain the complete typed Vue prop, event, slot, ref, controlled and `v-model` contracts. `IconButton` adds an accessible required label. ActiveLane icons work in ordinary icon slots:

```vue
<IconButton label="Close"><Icon name="lucide:x" /></IconButton>
```

No competing icon catalog is bundled.

## Programmatic services

Inside `UiProvider`, use `useDialog`, `useModal`, `useMessages`, `useNotifications`, and `useLoadingBar`. For non-component hosts, `createUiServices` creates discrete roots; pass reactive `configProviderProps` from the host theme service to keep them synchronized.

## Blocks and registry

`@activelane/ui/blocks` exports `EmptyStatePanel`, `SearchField`, `PropertyRow`, `Toolbar`, `ToolbarGroup`, and `StatusIndicator`. They contain no workbench runtime logic. `@activelane/ui/catalog` exports typed, stable kebab-case `componentCatalog`/`blockCatalog`, ID unions, entry metadata, and typed lookup helpers for a future workbench registry adapter—without global registration.

## Entry points

Use the root or cohesive `components`, `blocks`, `theme`, `providers`, `composables`, `catalog`, and `styles.css` subpaths. Development conditions resolve source; published imports and types resolve `dist`. Vue, icons, and Naive UI remain external in the ESM build, preserving per-component application bundler tree shaking.

## Showcase and development

Run `vite packages/al-ui/showcase` to inspect light/dark/high-contrast, both densities, narrow split content, forms, validation, disabled/loading/empty states, data, trees, overlays, and portals. Run `pnpm --filter @activelane/ui build`, `test`, `typecheck`, and `test:bundle` for verification.

## Deliberate exclusions

- `GlobalStyle`, `ThemeEditor`, `Element`, and low-level table DOM primitives are internal/vendor tooling rather than stable product controls.
- `LegacyTransfer` is superseded by `Transfer`.
- Raw provider components and the raw discrete factory are hidden behind `UiProvider` and ActiveLane composables.
- Naive's icon wrappers are replaced by slots plus `@activelane/icons`.

## Migration

This package begins the replacement of `@activelane/shadcn`. The old package and its consumers remain intact in this phase. New surfaces should target this API; the later repository-wide pass should adapt the workbench registry, migrate imports and themes, then remove Shadcn after consumer verification.
