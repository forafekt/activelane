# @activelane/workbench-api

Canonical public API and runtime package for the ActiveLane workbench application model.

Use this package for:

- extension manifests and contribution contracts
- runtime and workbench shell interfaces
- host and runtime context types
- capability, settings, and theme contracts
- runtime creation and host adapter helpers
- extension authoring helpers such as `defineWorkbenchExtension`

Ownership rule:

- `@activelane/workbench-api` is the canonical package for public contracts, runtime helpers, and extension authoring helpers
- `@activelane/workbench` consumes `@activelane/workbench-api` directly

Runtime host detection is exposed through `WorkbenchRuntimeApi["context"]`:

```ts
context.runtime.context.hostKind
context.runtime.context.runtimeId
context.runtime.context.capabilities
```

The source is split by concern under `src/`, and `src/index.ts` is the public barrel.

## Settings contributions

Extensions can contribute settings from their manifest. Grouped schema contributions are preferred:

```json
{
  "contributes": {
    "settings": [
      {
        "id": "my-extension",
        "title": "My Extension",
        "properties": {
          "myExtension.enabled": {
            "type": "boolean",
            "default": true,
            "description": "Enable this extension feature."
          }
        }
      }
    ]
  }
}
```

The workbench automatically registers contributed settings, validates defaults and enum values, persists user overrides through the host storage scope, and renders them in the settings UI. The legacy flat `WorkbenchSettingDefinition[]` manifest shape is still accepted for existing extensions.
