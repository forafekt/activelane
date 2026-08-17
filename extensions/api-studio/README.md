

## Create, validate, pack, inspect, and verify

```bash
go run ./go/cmd/alx validate ./extensions/api-studio/activelane.manifest.json
go run ./go/cmd/alx pack ./extensions/api-studio --output /tmp/api-studio.alx
go run ./go/cmd/alx inspect /tmp/api-studio.alx --json
go run ./go/cmd/alx verify /tmp/api-studio.alx
```

Packing unchanged input produces the same SHA-256 digest. The manifest is not coupled to
TypeScript; its entry can target any payload supported by the eventual host adapter.

## Publish, discover, and install

```bash
go run ./go/cmd/alx publish /tmp/api-studio.alx --registry local
go run ./go/cmd/alx search api-studio
go run ./go/cmd/alx info local/api-studio
go run ./go/cmd/alx info local/api-studio@1.0.0
go run ./go/cmd/alx install local/api-studio@1.0.0 --root /tmp/activelane-installed
```

