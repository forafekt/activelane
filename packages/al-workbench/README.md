# @activelane/workbench

Host-agnostic Vue shell for the ActiveLane workbench platform.

Responsibilities:

- activity rail
- sidebar pane
- tab groups and recursive split layout
- inspector pane
- command palette shell
- contribution-driven settings UI
- workbench UI styling and rendering

Non-responsibilities:

- product features
- capture logic
- editor logic
- host APIs
- extension lifecycle implementation

Those live in runtime, SDK, and host adapter packages.

Settings are rendered from the canonical runtime settings registry. Core workbench settings are registered by the built-in workbench extension, and extension settings appear automatically from manifest or activation contributions.

## Design System Conventions

- Workbench chrome must use semantic tokens from `packages/al-workbench/src/styles/index.css`
  such as `---surface`, `---panel`, `---focus-ring`, `---selected`, and
  `---elevation-*`.
- Extension-specific UI belongs in contributed surfaces, not core shell components.
- Shell components should keep host-specific behavior out of shared workbench code. Desktop title
  bars, native menu affordances, and OS-specific density live under host apps.
- Prefer scoped component styles for local layout and states. Add global CSS only for shared
  workbench primitives or design-system token mapping.
- Use `@activelane/icons` directly for workbench icons. `@activelane/shadcn` provides controls and
  overlays, not icon exports.
