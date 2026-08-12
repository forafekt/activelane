# @activelane/workbench

Vue Workbench runtime and product shell for ActiveLane.

The package owns runtime composition, extension activation, commands, menus, tabs, layout regions,
settings, explorer state, server-extension state, persistence, and the Vue shell that renders
those domains. Application hosts provide capabilities; Workbench does not import Wails or
generated Go bindings.

## Public entrypoints

- `@activelane/workbench` — Vue shell, host contracts, runtime composition, and the small application API.
- `@activelane/workbench/extensions` — extension-author contribution contracts and definition helpers.
- `@activelane/workbench/marketplace` — optional first-party extension marketplace contribution.
- `@activelane/workbench/themes` — built-in ActiveLane theme contributions.
- `@activelane/workbench/styles.css` — Workbench styling.

Desktop capabilities flow from Go through generated Wails bindings into the desktop frontend's
native capability implementation, then into `createNativeWorkbenchHost`. Generic Workbench code
depends only on those explicit capability interfaces.

Workbench imports semantic icons directly from `@activelane/icons` and generic UI primitives
directly from `@activelane/shadcn`; it does not re-export either package.

The canonical frontend architecture is documented in the repository's `ARCHITECTURE.md`.
