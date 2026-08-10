# @activelane/workbench/marketplace

First-party extension management surface for the ActiveLane workbench. The marketplace is an optional product extension: it contributes activity/sidebar/tab/settings/inspector surfaces, while core workbench navigation and home UI live in `@activelane/workbench`.

## Architecture

- `src/index.ts` registers marketplace workbench contributions.
- `src/services/backendMarketplaceCatalog.ts` adapts the runtime/backend extension registry into marketplace UI records.
- `src/composables/useMarketplaceStore.ts` owns marketplace state, filters, selected extension, and install/enable/disable actions.
- `src/components/*` contains the sidebar, main marketplace tab, details view, inspector panel, and shared display helpers.
- `src/types/marketplace.ts` defines marketplace-specific UI models.

## Boundaries

- Core workbench features belong in `@activelane/workbench`.
- Third-party, local, and product extensions are loaded through the extension runtime.
- Marketplace data should come from `runtime.extensions` and backend registry APIs, not local demo seed data.

## Development

Add new marketplace UI in `src/components`, update contribution registration in `src/index.ts`, and keep catalog behavior in `src/services/backendMarketplaceCatalog.ts`.
