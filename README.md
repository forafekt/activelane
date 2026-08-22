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

The root `go.work` composes the reusable `go` module and the Wails `apps/desktop` module. There is no
repository-root Go module. See [the registry architecture](docs/architecture/registry.md) and
[ADR 0002](docs/adr/0002-go-module-and-chi-routing.md) for package boundaries and routing decisions.

## Extension registry foundation

The repository also contains a self-hostable Go registry and the `alx` package CLI. The current
vertical slice validates and deterministically packs `.alx` files, publishes immutable versions,
searches local or remote registries, resolves namespaces to exactly one configured source, and
installs exact versions with persisted source and digest records.

```bash
source ./scripts/activelane-dev-env.sh
go run ./go/cmd/registry --allow-publish --data ./.activelane/registry
go run ./go/cmd/alx init /tmp/activelane-hello
go run ./go/cmd/alx pack /tmp/activelane-hello --output ./.activelane/packages/hello.alx
go run ./go/cmd/alx publish ./.activelane/packages/hello.alx --registry local
```

See [docs/guides/registry-workflow.md](docs/guides/registry-workflow.md) for the complete workflow
and [docs/architecture/registry.md](docs/architecture/registry.md) for boundaries and security
properties.

The desktop marketplace integration is documented in
[docs/guides/desktop-registry.md](docs/guides/desktop-registry.md).

## Structure

```text
apps/desktop/              Go + Wails v3 application and Vue entry point
packages/al-workbench/     Host-agnostic ActiveLane Workbench UI
packages/al-shadcn/        Shared Vue component system
packages/al-icons/         Shared icon exports
go/cmd/registry/          Go registry executable
go/cmd/alx/               Go extension package and registry CLI
go/                        Reusable Go module, HTTP API, and command composition roots
schemas/                   Language-neutral extension and registry configuration contracts
```
