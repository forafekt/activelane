# ActiveLane

ActiveLane is a desktop workbench built with Go, Wails v3, Vue, and TypeScript.
The canonical application lives in `apps/desktop`; reusable frontend contracts,
the workbench shell, icons, and UI components live in `packages`.

## Development

Requirements: Go 1.25 or newer, Wails v3 (`wails3`), Node.js, and pnpm 11.

```bash
pnpm install
cd apps/desktop
wails3 dev
```

Wails runs the Vite frontend, regenerates Go-to-TypeScript bindings, builds the
shared workspace packages, and launches the ActiveLane Workbench window.

Useful repository checks:

```bash
pnpm typecheck
pnpm build
cd apps/desktop
go test ./...
go vet ./...
```

## Structure

```text
apps/desktop/              Go + Wails v3 application and Vue entry point
packages/al-workbench/     Host-agnostic ActiveLane Workbench UI
packages/al-shadcn/        Shared Vue component system
packages/al-icons/         Shared icon exports
```
