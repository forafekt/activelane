# Desktop registry and marketplace

The desktop application reads the same version-1 registry configuration as `alx`. By default this
is `~/.config/activelane/registries.json`. Set `ACTIVELANE_REGISTRY_CONFIG` to select another file
and `ACTIVELANE_EXTENSIONS_DIR` to override the installation root before starting ActiveLane.

```bash
export ACTIVELANE_REGISTRY_CONFIG="$PWD/examples/registries.local.json"
export ACTIVELANE_EXTENSIONS_DIR="$HOME/.local/share/activelane/extensions"
cd apps/desktop
wails3 dev
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
- Active means the Workbench runtime loaded a discovered definition and registered contributions.

The current phase does not dynamically load a newly installed package definition. Install and
enable operations therefore return `restartRequired`. Enabling is persisted but does not fake an
active runtime record. If a definition is already discoverable and activation fails, Workbench
rolls the enabled preference back through the native service and reports the activation error.

On uninstall, Workbench deactivates a known active definition and persists disabled state first.
Go then verifies the exact package-owned path, atomically moves it into an installation-root
quarantine, updates `installed.json`, and removes the quarantine. Enabled packages cannot be
uninstalled directly by the service.

## Persistence and status

Default state locations are:

```text
~/.config/activelane/registries.json
~/.local/share/activelane/extensions/installed.json
~/.local/share/activelane/extensions/<namespace>/<name>/<version>/
```

Restarting ActiveLane reloads installed and enabled records. The service also verifies that the
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
- `RESTART_REQUIRED`: installation state is persisted, but the current desktop build does not yet
  discover downloaded extension definitions. Restarting preserves and re-reads the state; activation
  remains unavailable until the runtime discovery adapter is implemented.

Authentication, publisher signatures, malware scanning and entitlement are not implemented. Remote
registries requiring credentials are not yet supported by the desktop service.

## First-run UX specification

A future small setup screen should write this same canonical file: Personal enables the official
source; Organisation configures an internal remote source and optionally the public source; Offline
requires a directory or internal source with public disabled; Custom exposes the normal registry
fields. It must validate duplicate scopes through Go before saving. No separate frontend settings
format should be introduced.
