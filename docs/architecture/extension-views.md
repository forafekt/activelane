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

## Desktop asset delivery

The Wails desktop adapter implements `ExtensionAssetHost` through the native extension service. The
Workbench asks for an extension ID and package-relative entry path and receives only a browser-loadable
URL. The renderer never receives an extraction directory or operating-system path.

Wails serves the complete installed package tree below:

```text
/__activelane/extensions/<namespace>/<name>/<version>/<resource>
```

The version in that URL is selected from the authoritative installed-extension record, so runtime code
and view resources come from the same installation. Requests are accepted only for the matching,
enabled installation. The Go resource handler decodes and normalizes the path once, rejects absolute or
traversing paths (including encoded traversal), resolves symlinks, verifies that the final file remains
inside the package root, and lets `http.ServeContent` provide MIME types and nested relative asset
loading. Unknown, disabled, and uninstalled packages return no resource. Responses include an explicit
CORS header because a sandboxed iframe without `allow-same-origin` has an opaque origin and must still
be able to import its packaged ES modules.

## Isolation and bridge lifecycle

The browser implementation uses `sandbox="allow-scripts"`. It intentionally does not grant same-origin,
forms, popups, navigation, or direct Workbench access. The Workbench creates one `MessageChannel` per
view instance and transfers its port only to the iframe window associated with the registered extension,
view definition, and instance. Re-registration closes the previous channel; closing a view, disabling
an extension, or uninstalling it disposes the contribution and its channel.

Bridge values cross a structured-clone boundary. View context is therefore returned as detached JSON
data rather than a Vue reactive proxy. Each isolated application receives its initial normalized theme
and subsequent theme changes through the bridge, and applies only `--al-*` variables to its own document
root. Events are scoped to the owning extension and allow sibling view instances to coordinate without
access to Workbench internals.

## Instance identity and cleanup

Single-instance surfaces use their definition identity. Multi-instance editors add a stable instance ID
and independent JSON context, so two editors created from the same definition cannot overwrite one
another. Workbench-owned tabs, titles, dirty state, focus, close affordances, sidebars, inspectors, and
panels remain outside the isolated document.

Contribution registration is generation-based. A newly activated contribution replaces an older entry
with the same owner and ID, while disposal removes only the generation that registered it. This avoids
both duplicate declarative/runtime contributions and stale reactive-proxy entries during disable,
reload, or uninstall. Persisted surface references are reconciled against the current registry during
startup, leaving no extension chrome after an uninstalled package is restarted.
