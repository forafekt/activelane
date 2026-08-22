# Extension applications

ActiveLane separates the extension control plane from its presentation layer.

```text
activelane.manifest.json
  ├─ containers (Workbench placement)
  ├─ views (application definitions)
  └─ commands (declarative discovery)
             │
             ▼
Extension runtime ── services, commands, shared state
             ▲
             │ typed, capability-checked MessagePort
             ▼
View instance ── isolated HTML application
```

The Workbench owns containers, tabs, headers, focus, placement, persistence, and view-instance
identity. An extension owns the HTML application rendered inside that chrome. A view definition is
static manifest data; a view instance is runtime state and can carry context. Editor definitions may
opt into multiple instances.

## Rendering contract

`renderer.type: "isolated"` is a platform-neutral contract. Browser hosts currently implement it
with a sandboxed iframe and transfer a dedicated `MessagePort` after validating extension, definition,
instance, and frame identities. A native host can later use a WebView or process without changing the
manifest or client API.

Isolated applications use `@activelane/extension-view`, which has no Vue dependency. The API exposes
view lifecycle, extension-owned commands, declared runtime services, extension storage, scoped events,
and normalized theme tokens. It does not expose Workbench stores, Vue components, or native host APIs.

## Package layout

An extension package contains one runtime ES module and any number of HTML entries:

```text
dist/extension.js
dist/views/sidebar/index.html
dist/views/editor/index.html
dist/views/inspector/index.html
```

Every entry is package-relative and validated against traversal. The host resolves it from extension
identity plus the packaged path through its `extensionAssets` capability; definitions never contain an
installation path or development URL.
