# Local registry and package workflow

All commands below run from the repository root.

## Start and configure

Start the service on loopback. Publishing is disabled unless explicitly enabled:

```bash
go run ./go/cmd/registry \
  --listen 127.0.0.1:8787 \
  --data ./.activelane/registry \
  --id local.activelane \
  --allow-publish
```

Use the checked-in local-only configuration:

```bash
source ./scripts/activelane-dev-env.sh
```

This file has no official public registry, so public access is completely disabled. The equivalent
persistent CLI setup is:

```bash
alx registry add local --type remote --url http://127.0.0.1:8787 --scopes local --priority 100
alx registry test local
alx registry list
```

For an offline directory registry, use `--type directory --path /srv/activelane-registry`. Local
directory publishing, search, info, and installation require no HTTP process.

## Create, validate, pack, inspect, and verify

```bash
go run ./go/cmd/alx init /tmp/my-extension
go run ./go/cmd/alx validate /tmp/my-extension/activelane.manifest.json
go run ./go/cmd/alx pack /tmp/my-extension --output /tmp/my-extension.alx
go run ./go/cmd/alx inspect /tmp/my-extension.alx --json
go run ./go/cmd/alx verify /tmp/my-extension.alx
```

Packing unchanged input produces the same SHA-256 digest. The manifest `entry` identifies
a browser-native ES module in the ALX. Its default export must be a
`WorkbenchExtensionDefinition` (normally created with `defineExtension` from
`@activelane/workbench/extensions`). The desktop loads that file and its relative package
imports directly from the installed ALX directory, independently of npm and Vite resolution.

## Publish, discover, and install

```bash
go run ./go/cmd/alx publish /tmp/hello.alx --registry local
go run ./go/cmd/alx search hello
go run ./go/cmd/alx info local/hello
go run ./go/cmd/alx info local/hello@1.0.0
go run ./go/cmd/alx install local/hello@1.0.0 --root ./.activelane/extensions
```

The final command writes `./.activelane/extensions/installed.json`. Repeating the workflow after
restarting the registry reads the same persisted metadata and blobs. Republishing version `1.0.0`
returns `VERSION_EXISTS`, even for identical bytes.

## Seed development marketplace data

Populate a realistic, deterministic local marketplace with the in-process ALX
seeder. Every generated extension follows normal validation, packaging,
verification, and publication:

```bash
go run ./go/cmd/alx seed --registry local \
  --profile marketplace-demo --count 500 --seed 42
```

Generated source projects are removed after success. Pass `--keep` or
`--output <directory>` to inspect them. Repeating the command is idempotent.
Remove only seeder-owned versions with:

```bash
go run ./go/cmd/alx seed clean --registry local
```

The `minimal`, `subscriptions`, and `marketplace-stress` profiles are also
available; run `alx seed --help` for details. Remote development registries
must be running with publication enabled.

Yank and restore are currently HTTP administrative operations:

```bash
curl -X POST http://127.0.0.1:8787/v1/extensions/local/hello/versions/1.0.0/yank
curl -X DELETE http://127.0.0.1:8787/v1/extensions/local/hello/versions/1.0.0/yank
```

Exact installs reject a yanked release. Already installed digest-pinned content remains intact.

## Validation

```bash
gofmt -w go apps/desktop
cd go && go test ./... && go vet ./...
cd ../apps/desktop && go test ./... && go vet ./...
cd ../..
pnpm typecheck
pnpm -r --if-present test
pnpm build
```

The Go tests use temporary directories and cover validation, deterministic packing, traversal,
immutable and concurrent publication, yank/restore, configuration routing, installation records,
API errors, and the CLI authoring workflow.
