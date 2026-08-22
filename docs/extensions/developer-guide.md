# Building ActiveLane extensions

An ActiveLane extension has two independent halves: one runtime owns behavior, while isolated browser
applications own presentation. ActiveLane owns their placement, chrome, lifecycle, permissions, and
communication boundary. View applications may use any browser-compatible framework; the public bridge
has no Vue or Workbench dependency.

## Create a project

Create a vanilla TypeScript extension with a runtime, primary sidebar, and multi-instance editor:

```bash
alx create request-tools --publisher acme \
  --view primary-sidebar \
  --view editor
cd request-tools
pnpm install
alx build
alx validate
alx pack --output request-tools.alx
alx verify request-tools.alx
```

`--view` is repeatable and accepts `primary-sidebar`, `secondary-sidebar`, `editor`, or `panel`.
Without any `--view`, the scaffold creates a primary sidebar and editor. Use `--no-runtime` only for an
extension that intentionally has no activation behavior. The generated Vite configuration emits the
canonical package layout:

```text
activelane.manifest.json
dist/
├── extension.js
├── assets/
└── views/
    ├── primary/index.html
    └── editor/index.html
```

`alx build` runs the extension's build script and then validates its emitted contract. `alx validate`
checks the source directory: manifest semantics, duplicate container/view/command IDs, safe
package-relative paths, the runtime default export, and every declared view entry. `alx pack` repeats
those checks, excludes development dependencies and Git metadata, rejects symlinks, and creates a
deterministic archive. `alx verify` validates the archive independently, including duplicate or unsafe
archive paths and missing declared entries.

## Manifest contributions

Containers describe Workbench placement. Views describe applications placed inside those containers:

```json
{
  "entry": "dist/extension.js",
  "permissions": ["extension-storage"],
  "contributes": {
    "containers": [
      { "id": "notes.editors", "location": "editor", "title": "Notes" }
    ],
    "views": [
      {
        "id": "notes.editor",
        "container": "notes.editors",
        "title": "Note",
        "multiple": true,
        "renderer": { "type": "isolated", "entry": "dist/views/editor/index.html" }
      }
    ],
    "commands": [
      { "id": "notes.new", "title": "Notes: New Note" }
    ]
  }
}
```

The canonical vocabulary is: **container**, **view definition**, **view instance**, **renderer**,
**contribution**, and **extension runtime**. A definition is static manifest data. An instance has its
own serializable context, title, dirty state, and identity. ActiveLane owns tabs, groups, close actions,
focus, sidebars, inspectors, and panels.

## Runtime

The runtime module default-exports one extension definition. It registers executable behavior for
declarative manifest contributions and returns a disposable:

```ts
export default {
  manifest: {
    id: '@acme/notes',
    name: 'notes',
    displayName: 'Notes',
    version: '0.1.0',
  },
  activate(runtime) {
    const service = runtime.capabilities.register(
      { id: 'notes.documents.read', title: 'Read notes', kind: 'service' },
      async ([id]) => loadNote(String(id)),
    )
    const commands = runtime.contribute.commands({
      id: 'notes.new',
      title: 'Notes: New Note',
      run: () => runtime.workbench.openTab({
        id: `note:${crypto.randomUUID()}`,
        kind: 'notes.editor',
        surfaceId: 'notes.editor',
        title: 'Untitled',
        ownerExtensionId: '@acme/notes',
        input: { noteId: 'new' },
      }),
    })
    return { dispose: () => { service.dispose(); commands.dispose() } }
  },
}
```

Manifest metadata is authoritative for installed extensions. The runtime's embedded manifest is an
identity and version assertion, not a second contribution manifest. ActiveLane disposes one activation
generation before enabling a replacement, preventing duplicate commands, services, or surfaces.

## Isolated view API

Connect once from each HTML application:

```ts
import {
  ActiveLaneViewError,
  connectActiveLaneView,
} from '@activelane/extension/view'

interface EditorContext { noteId: string }
interface NotesService { read(id: string): Promise<{ title: string; body: string }> }

const activelane = await connectActiveLaneView()
const context = await activelane.view.getContext<EditorContext>()
const notes = activelane.services.get<NotesService>('notes.documents')
const note = await notes.call('read', context.noteId)

const themeChange = activelane.theme.onDidChange(applyTheme)
activelane.onDispose(() => themeChange.dispose())

try {
  await activelane.view.setDirty(true)
} catch (error) {
  if (error instanceof ActiveLaneViewError) console.error(error.code, error.message)
}
```

The API groups view chrome, commands, services, extension-scoped events, extension storage, and theme
tokens. Context and bridge values must be structured-clone/JSON-compatible; functions, DOM nodes, and
reactive framework proxies are not valid context. Service handles are typed but explicit—there is no
property-proxy RPC magic.

## Runtime SDK and resource identity

Lifecycle code imports `@activelane/extension`; it must not import Workbench packages:

```ts
import { defineExtension } from '@activelane/extension'

export default defineExtension({
  manifest: { id: '@sample/requests', name: 'requests', displayName: 'Requests', version: '0.1.0' },
  activate(runtime) {
    runtime.contribute.commands({
      id: 'requests.open',
      title: 'Open request',
      run: () => runtime.workbench.openView('requests.editor', {
        resource: 'request:users',
        context: { requestId: 'users' },
      }),
    })
  },
})
```

`resource` is the stable logical identity. Opening the same definition and resource reveals the existing
instance; a different resource creates a separate instance and bridge. Use `policy: 'always-new'` only
for resources that intentionally have multiple simultaneous instances. Persistent tabs retain resource
identity and immutable context across Workbench restoration.

Storage requires the declarative `extension-storage` permission. Service calls require the view's
declared capability. Commands are restricted to their owning extension. Events are visible only to
view instances owned by the same extension. Native filesystem, shell, cross-extension communication,
and arbitrary network privileges are not currently exposed by the view bridge.

## Themes and cleanup

Apply the initial theme and subscribe to changes:

```ts
const applyTheme = ({ tokens }: { tokens: Record<string, string> }) => {
  for (const [name, value] of Object.entries(tokens))
    document.documentElement.style.setProperty(name, value)
}

applyTheme(await activelane.theme.getCurrent())
const subscription = activelane.theme.onDidChange(applyTheme)
activelane.onDispose(() => subscription.dispose())
window.addEventListener('beforeunload', () => activelane.dispose(), { once: true })
```

Only normalized `--al-*` tokens cross the bridge. Isolated applications must not query Workbench DOM
classes or import Workbench Vue components.

## Development workflow

Start the desktop and run this from the extension project (either may start first):

```bash
alx dev
```

`alx dev` starts the project's development command on a dynamically selected loopback port, bundles
the runtime as a self-contained ES module, and registers one session with the desktop-owned development
service. It is not a local package installation: no install record or production package directory is
created. The owning socket stays open for the session; Ctrl+C, CLI failure, or process disconnect removes
the registration and its Workbench contributions.

The generated `activelane.dev.json` maps the production manifest entries to source entries:

```json
{
  "runtime": "src/runtime/extension.ts",
  "views": {
    "dist/views/primary/index.html": "src/views/primary/index.html",
    "dist/views/editor/index.html": "src/views/editor/index.html"
  }
}
```

View applications use their normal Vite HTML and module graph, including Vite HMR. This remains
framework-neutral: the host only resolves HTML entry URLs. Runtime source is deliberately different.
`alx` bundles it with the workspace's existing esbuild tool, assigns one monotonic generation, and asks
the existing runtime owner to deactivate, dispose, load, and activate. A failed bundle or invalid manifest
does not replace the active generation; fixing the file triggers the next attempt. A bundle that loads but
fails activation leaves the extension in a clean failed state rather than reviving half of the old
generation.

`--port` pins the view server port and `--runner` selects `pnpm`, `npm`, or `yarn` for generated projects.
Projects with another frontend stack may put an explicit framework command in `activelane.dev.json`;
`{port}` is replaced with the selected port. The command must serve every configured HTML entry over
loopback HTTP.

Commands run without an explicit project path discover `activelane.manifest.json` by walking upward,
so `alx build`, `alx validate`, `alx pack`, and `alx dev` also work from a nested source directory.
An explicit path always wins. For development, CLI flags override `activelane.dev.json`; the desktop
socket environment/default is used only when project configuration does not supply an endpoint.

## Repository-local `.activelane` state

`.activelane` is host and registry state for developing the ActiveLane repository itself, not extension
project configuration. Repository scripts initialize registry configuration, installed packages,
registry data, Go build cache, and isolated XDG directories there. They are thin orchestration around
the Go registry and `alx` commands. Generated extensions use the source-controlled
`activelane.manifest.json` and `activelane.dev.json`; `alx create`, `build`, `validate`, `pack`, and `dev`
do not create or interpret an extension-local `.activelane` directory. This keeps third-party projects
portable and avoids a second hidden configuration system.

Installed and repository runtime state under `.activelane` is generated and ignored by Git. Extension
authors should not commit or manually construct it. The normal extension workflow is `alx dev` beside a
running desktop; repository scripts remain only for starting the repository's local registry, seed data,
and desktop with a shared isolated host profile.

`alx create --framework vanilla` generates the framework-free path used by the Scratchpad reference
extension. Unsupported framework names fail explicitly; the CLI does not advertise templates it cannot
maintain.

Current limitations are deliberate: the development socket transport is implemented on Unix hosts.
Runtime, lifecycle, command, asset, and isolated-view failures are correlated in the bounded **Extension
Diagnostics** developer panel. Normal view failure UI stays safe; stack traces, paths, and internal URLs
remain in developer diagnostics.
