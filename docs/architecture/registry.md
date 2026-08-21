# Registry architecture

## Go module layout

Reusable Go code lives in the `go` module (`github.com/activelane/activelane/go`), mirroring the
repository's reusable TypeScript packages. Its public packages have narrow ownership:

- `alx` defines manifests and deterministic, security-checked archives.
- `registry` defines registry records, filesystem persistence, and source access.
- `registry/httpapi` maps the registry operations to the versioned HTTP protocol.
- `registryconfig` loads, validates, and resolves multi-registry configuration.
- `install` resolves and safely stages exact versions and persists lifecycle state.

`go/cmd/alx` and `go/cmd/registry` are composition roots, not libraries. The dependency direction is
`alx -> registry -> install -> apps/desktop`; `registryconfig` is a leaf package consumed where
configuration is needed. Reusable packages never import commands.

The Wails application remains the separate `apps/desktop` module because it has its own application
lifecycle and generated bindings. The root `go.work` composes these two real module roots. Commands
run from the repository root in workspace mode (`go run ./go/cmd/alx --help`) or from `go/` as
`go run ./cmd/alx --help`. Because the reusable module is not independently published yet, desktop
builds intentionally require repository workspace mode. Neither module contains a local `replace`;
the temporary mapping is centralized in `go.work` and can be removed when the module is published.

The HTTP API uses `chi` because it preserves standard `net/http` handlers and `httptest`, provides
route parameters and grouped versioned routes, and adds no framework-specific domain context. Route
construction is in `registry/httpapi/router.go`; resource handlers are split by extensions,
versions, packages, and discovery. Add an endpoint to the matching resource file and declare its
method and path in `NewRouter`. Add middleware only in `NewRouter`, with a concrete transport concern;
middleware must not perform storage or domain operations.

Listen addresses, data paths, registry identity, publishing policy, body limits, and process
timeouts are deployment configuration with safe command defaults. Protocol versions, route paths,
media types, API error codes, schema names, and archive limits are protocol/security constants.

All Go changes must pass `gofmt`, `go test ./...`, and `go vet ./...` in both modules. `gofumpt` was
evaluated but not made a repository dependency: `gofmt` is sufficient and avoids applying an extra
style tool to generated Wails sources.

Run `go mod tidy` directly in `go/`. For desktop development, run `go work sync` and desktop tests
from the repository workspace. A standalone `apps/desktop/go mod tidy` cannot resolve the unpublished
reusable module; Wails therefore synchronises the workspace instead. This constraint disappears once
`github.com/activelane/activelane/go` has a published module version.

## Ownership and boundaries

The registry owns available release metadata and immutable package blobs. Its filesystem store is
content-addressed by SHA-256 and makes a release visible only after the package has been validated
and the blob safely persisted. A version cannot be overwritten. Yanking changes resolution status
without deleting metadata or the blob.

The marketplace is presentation and discovery. The existing host-agnostic Workbench marketplace
maps catalog records, installed records, enablement, and runtime failures into distinct UI states.
It does not own package bytes or activation. A future desktop adapter can aggregate search results
from configured sources while retaining `registryId` on every record.

The local installer owns machine-local state in `<install-root>/installed.json` and extracted
versions below `<install-root>/<namespace>/<name>/<version>`. Each record contains the registry ID,
source URL or directory, exact version, manifest digest, package digest, timestamp, install path,
and enabled preference. Install never activates an extension and defaults `enabled` to false.

The Workbench runtime owns definition discovery, activation, contributions, deactivation, and
failure reporting. Entitlement and organisation policy own future access decisions; neither is
embedded in blob storage.

## Identity and deterministic resolution

Manifests retain the current Workbench identity form `@namespace/name`; CLI references accept
`namespace/name@exact-version`. A version is installed by this fixed sequence:

```text
namespace -> one enabled configured registry -> exact version metadata -> digest-pinned blob
```

Duplicate enabled scope routes are invalid. Priority is display ordering only and never enables
fallback. Search intentionally aggregates all enabled sources; install and info do not.

## Package and storage format

`.alx` is a deterministic ZIP containing `activelane.manifest.json`, the declared entrypoint, and
arbitrary platform-neutral payload directories such as `extension/`, `assets/`, `licenses/`, and
SBOM files. Files are lexically ordered, timestamps and modes are normalised, and symlinks,
absolute paths, backslashes, traversal paths, duplicates, missing entrypoints, oversized manifests,
and malformed archives are rejected.

Registry data is an implementation detail:

```text
data/blobs/sha256/<prefix>/<digest>
data/metadata/packages/<namespace>/<name>/versions/<version>.json
```

The package CLI and service share the Go validator so business rules are not duplicated. JSON
Schemas in `schemas/` are the language-neutral authoring contracts.

The JSON Schemas are authoritative for manifest and registry configuration wire shapes. Go owns
security-sensitive validation and operations; TypeScript owns Workbench authoring validation. Both
validators consume the checked-in example manifest in parity tests, and Wails transport DTOs are
generated from the registered desktop service rather than maintained by hand.

## API

The implemented protocol version is `1`:

- `GET /.well-known/activelane-registry`
- `GET /healthz`
- `GET /v1/extensions?search=&limit=&offset=`
- `GET /v1/extensions/{namespace}/{name}`
- `GET /v1/extensions/{namespace}/{name}/versions`
- `GET /v1/extensions/{namespace}/{name}/versions/{version}`
- `POST /v1/extensions/{namespace}/{name}/versions`
- `GET /v1/extensions/{namespace}/{name}/versions/{version}/package`
- `POST /v1/extensions/{namespace}/{name}/versions/{version}/yank`
- `DELETE /v1/extensions/{namespace}/{name}/versions/{version}/yank`

Errors use `{ "error": { "code": "...", "message": "..." } }`. Immutable downloads expose an
ETag and immutable cache policy. `chi` owns path and method matching; `404`, `405`, panic recovery,
request IDs, content-type validation, and publication body limits use the same structured transport.

## Security properties and deliberate limits

Implemented now: SHA-256 package and manifest digests, digest verification before extraction,
archive traversal protections, request/package/manifest size limits, atomic metadata writes,
immutable versions, and a server default of loopback plus publishing disabled.

Not implemented: authentication, namespace authorisation, signatures, trusted publisher identity,
malware scanning, transparency logs, policy, licensing, or entitlement. `--allow-publish` is an
explicit unauthenticated development switch. Discovery advertises signatures, offline bundles,
commerce, and default publishing as false. Credentials have a provider boundary in the TypeScript
registry contracts but are not persisted by this Go configuration.
