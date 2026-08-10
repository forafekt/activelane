# ActiveLane frontend architecture

`@activelane/icons` owns the bounded semantic Vue icon catalog. It exposes only `getIcon`,
`getIcons`, and the icon component type; unknown names resolve to the visible spinner fallback.

`@activelane/shadcn` owns generic ActiveLane Vue controls and their component-level styles. It
depends on the icon catalog but contains no Workbench behavior.

`@activelane/workbench` owns the product shell, runtime composition, built-in contributions,
state, persistence, and host-neutral services. Its root entrypoint is the application composition
API. `@activelane/workbench/extensions` is the supported contract for extension definitions and
contributions. The `marketplace` and `themes` subpaths are cohesive optional first-party extension
catalogs. Other Workbench modules are internal implementation details.

The desktop Vue application is the composition root. `createDesktopPlatform` adapts the narrow
filesystem, dialog, clipboard, notification, window, and lifecycle capabilities supplied by Wails
and Go, then passes them to `createNativeWorkbenchHost` and `createVueExtensionRuntime`. Workbench,
Shadcn, and Icons never import Wails or generated bindings.

An extension follows one path: a definition is validated and registered by the runtime, its
declarative contributions are stored in the canonical registries, consumers read those registries,
and the runtime disposes registrations, subscriptions, and the extension activation context during
teardown. Extensions receive services through their context and do not mutate Workbench stores.

The dependency direction is:

```text
@activelane/icons
        ↑
@activelane/shadcn
        ↑
@activelane/workbench
        ↑
apps/desktop Vue composition
        ↑
Wails runtime and generated Go bindings
```

Theme ownership is similarly direct: Shadcn supplies generic component variables and styles,
Workbench supplies shell layout and product theme definitions, and the desktop host only selects
and applies capabilities needed to run that shell.
