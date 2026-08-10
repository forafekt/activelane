# ActiveLane Desktop

This is the canonical ActiveLane desktop application. Wails v3 owns the native
window and application lifecycle; the Vue entry point mounts the shared
ActiveLane Workbench.

Native filesystem operations are implemented by `WorkspaceService` in Go and
consumed through generated Wails bindings by `frontend/src/services/native.ts`.
The desktop frontend adapts those bindings to the host capability contracts exposed by
`@activelane/workbench`; Workbench itself remains independent of Wails.

From the repository root, install dependencies once and launch the app:

```bash
pnpm install
cd apps/desktop
wails3 dev
```

Production build:

```bash
wails3 build
```

Do not edit `frontend/bindings`; Wails regenerates it from the registered Go
services.
