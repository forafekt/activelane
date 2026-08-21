# Desktop registry and marketplace

## Running ActiveLane locally with the Marketplace

Run each command from the repository root in a separate terminal. All three
commands use the project-local `.activelane/registries.json` initialized from
`examples/registries.local.json`, where `local` resolves to `http://127.0.0.1:8787`.

### Terminal 1 — start the persistent development registry

```bash
pnpm registry:dev
```

The startup banner reports the URL, storage directory, registry ID, publishing
state, and health endpoint. Development data persists under `./.activelane/registry`
across registry restarts. Confirm readiness with:

```bash
curl http://127.0.0.1:8787/healthz
```

### Terminal 2 — seed and verify the Marketplace

```bash
pnpm marketplace:seed
pnpm marketplace:status
```

The status command must report `Extensions: 500`. Repeating the seed is
idempotent and reports the versions as existing.

For a fast 12-extension dataset instead:

```bash
pnpm marketplace:seed:minimal
```

### Terminal 3 — start the Wails desktop application

```bash
pnpm dev:desktop
```

Open **Extensions Marketplace**, select **Discover**, and refresh if the view
was already open. The desktop Go service reads the same checked-in registry
profile and queries the real registry HTTP API; the frontend has no mock
Marketplace dataset.

### Cleanup and reset

Remove only versions carrying internal seed provenance:

```bash
pnpm marketplace:clean
```

To completely reset this disposable local registry, stop the registry first,
then remove `./.activelane/registry`. This also removes genuine packages
published there, unlike `marketplace:clean`.

If seeding reports that `local` is unavailable, start `pnpm registry:dev` and
wait for its readiness banner. Desktop startup does not start the registry;
when it is offline, Marketplace reports the source as unavailable rather than
substituting frontend data.

Repository development initializes `./.activelane/registries.json` from the checked-in example.
The desktop and ALX commands share that file and keep installed packages under
`./.activelane/extensions`.

```bash
pnpm dev:desktop
```

The Wails `ExtensionService` reads configuration and performs search, resolution, verification,
installation, enablement and uninstall operations in Go. Generated bindings are translated by the
desktop frontend into host-neutral Workbench capabilities. Workbench never imports Wails or reads
the native filesystem.

## Marketplace behaviour

Opening Extensions Marketplace searches every enabled registry. Successful results retain their
registry ID and display name. An unavailable registry is shown as a partial failure while results
from other registries remain visible. The page distinguishes no configured registries, local-only
operation, public-registry-disabled operation and partial offline operation.

Installation always sends the exact visible registry ID, extension ID and version to Go. Go then
confirms that the selected registry owns the namespace; it never repeats an unordered search.
Yanked, incompatible or ambiguous selections are rejected.

The details page shows source, compatibility, version status, installed version, verification state,
permissions and requested capabilities. Registry descriptions and README text are rendered as plain
text. Registry-provided inline SVG markup is not rendered as HTML.

## Installed, enabled and active

These states remain distinct:

- Installed means verified package files and an exact record exist under the installation root.
- Enabled is a persisted user preference in `installed.json`.
- Loaded means the desktop asset boundary resolved the installed manifest's `entry` and imported
  that self-contained ES module.
- Active means Workbench called that module's canonical `activate(context)` function and registered
  its owned contributions.

Installation, loading and activation are separate operations. Marketplace install asks Go to
download, digest-check and extract the ALX package, then Workbench loads the returned exact version,
enables it and activates it without a rebuild or restart. Disable calls `deactivate`, disposes every
contribution registered through the extension-owned registrar, and persists disabled state. Enable
loads the package if necessary and activates it again. Uninstall deactivates and disposes first,
persists disabled state, then lets Go quarantine and remove the package and inventory record.

On uninstall, Workbench deactivates a known active definition and persists disabled state first.
Go then verifies the exact package-owned path, atomically moves it into an installation-root
quarantine, updates `installed.json`, and removes the quarantine. Enabled packages cannot be
uninstalled directly by the service.

## Persistence and status

Default state locations are:

```text
./.activelane/registries.json
./.activelane/extensions/installed.json
./.activelane/extensions/<namespace>/<name>/<version>/
./.activelane/registry/
./.activelane/xdg/{data,cache,config}/
```

Restarting ActiveLane reloads installed records, loads only enabled packages, and activates each
one independently. A load or activation failure is recorded against that extension and does not
prevent later extensions from starting. The service also verifies that the
manifest is parseable, its canonical digest still matches, and its entrypoint remains present.
`verified` means verified during install and currently consistent at those checks; the original
archive is not retained for full post-install package re-hashing.

Registry configuration remains file/CLI managed in this phase. The Marketplace reports read-only
registry mode and connection status; it does not expose credentials or a partial editor.

```bash
go run ./go/cmd/alx registry list
go run ./go/cmd/alx registry test local
go run ./go/cmd/alx registry disable activelane
```

For local-only operation, configure only enabled `directory` sources or disable every remote source.

## Error codes and troubleshooting

- `REGISTRY_CONFIG_INVALID`: validate the JSON and check duplicate enabled scopes.
- `REGISTRY_UNAVAILABLE`: test the URL or directory and verify the registry is running.
- `REGISTRY_SCOPE_AMBIGUOUS`: ensure exactly one enabled source owns the namespace.
- `VERSION_YANKED` / `VERSION_INCOMPATIBLE`: select a supported published release.
- `PACKAGE_DIGEST_MISMATCH` / `PACKAGE_INVALID`: do not bypass verification; republish a new version.
- `INSTALLATION_CORRUPT`: inspect `installed.json`, the package directory and manifest entrypoint.
- Activation errors include the extension ID, installed version and failing stage in the desktop
  console; disable or uninstall remains available for recovery.

## Runtime loading boundary

```text
Registry -> ALX -> Go install service -> installed package
  -> manifest entry -> same-origin runtime module endpoint
  -> ExtensionManager -> activate(context) -> owned Workbench registries
```

The Wails asset middleware exposes only the manifest-declared entry point for an exact package in
`installed.json`; it is not a filesystem server. It re-parses and identity-checks the manifest,
rejects paths outside the installed package, requires a regular file, sets JavaScript and `nosniff`
headers, and serves the compiled module without `eval` or source-string execution. Runtime modules
must bundle their browser dependencies and assets, so Vite does not need an import map or knowledge
of marketplace extension IDs. Installed extension code is trusted executable software: package
digest and manifest checks exist, while publisher signatures and sandboxing remain future security
work. Requested capabilities continue through the existing scoped Workbench context.

Startup is:

```text
Desktop starts -> read installed.json -> keep disabled packages unloaded
  -> load each enabled manifest entry -> activate independently
```

Authentication, publisher signatures, malware scanning and entitlement are not implemented. Remote
registries requiring credentials are not yet supported by the desktop service.

## First-run UX specification

A future small setup screen should write this same canonical file: Personal enables the official
source; Organisation configures an internal remote source and optionally the public source; Offline
requires a directory or internal source with public disabled; Custom exposes the normal registry
fields. It must validate duplicate scopes through Go before saving. No separate frontend settings
format should be introduced.
