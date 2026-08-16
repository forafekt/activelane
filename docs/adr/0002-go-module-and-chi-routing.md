# ADR 0002: Reusable Go module layout and chi HTTP routing

- Status: accepted
- Date: 2026-08-16

## Context

Registry, installer, registry configuration, and `.alx` code initially lived in a repository-root
module under `internal/`. That made reusable domain code part of an accidental composition root,
prevented the separate desktop module from importing it without a root-module `replace`, and mixed
manual HTTP path parsing with domain storage.

## Decision

Use one reusable module at `/go`, with public `alx`, `registry`, `registryconfig`, and `install`
packages. Keep executable composition roots in `/go/cmd` and the Wails application in its existing
`/apps/desktop` module. Compose only those module roots in `/go.work`; do not keep a root `go.mod` or
module-local replacement directives. Until the reusable module is published, keep its sole local
mapping in `go.work` so desktop dependency metadata stays explicit without embedding a repository
path in the desktop module.

Move registry transport to `registry/httpapi` and use `github.com/go-chi/chi/v5`. `chi` declares
methods and nested parameters centrally while retaining standard `net/http` interfaces. Transport
handlers validate input, call registry operations, and translate results into consistent responses.
The registry command owns flags, `http.Server`, timeouts, signals, and graceful shutdown.

## Consequences

Reusable packages are independently importable and testable, command packages cannot become hidden
dependencies, and desktop integration is explicit through the workspace. The new direct dependency
is `chi` (BSD-3-Clause); standard-library JSON, HTTP, ZIP, hashing, and logging remain in use.
Standalone desktop module commands require a published reusable module in the future; during local
development they intentionally run in repository workspace mode.
