

## Create, validate, pack, inspect, and verify

```bash
go run ./go/cmd/alx validate ./extensions/api-studio/activelane.manifest.json
go run ./go/cmd/alx pack ./extensions/api-studio --output ./.activelane/packages/api-studio-0.0.4.alx
go run ./go/cmd/alx inspect ./.activelane/packages/api-studio-0.0.4.alx --json
go run ./go/cmd/alx verify ./.activelane/packages/api-studio-0.0.4.alx
```

Packing unchanged input produces the same SHA-256 digest. `entry` must identify a
browser-native ES module in the package. That module has one public contract: its default
export is a `WorkbenchExtensionDefinition`, normally created with `defineExtension` from
`@activelane/workbench/extensions`. Installed modules are loaded from their extracted ALX
directory; they are never resolved through the desktop application's npm/Vite graph.

## Publish, discover, and install

```bash
go run ./go/cmd/alx publish ./.activelane/packages/api-studio-0.0.4.alx --registry local
go run ./go/cmd/alx search api-studio
go run ./go/cmd/alx info local/api-studio
go run ./go/cmd/alx info local/api-studio@1.0.0
go run ./go/cmd/alx install activelane/api-studio@0.0.0 --root ./.activelane/extensions
```
