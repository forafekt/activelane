# @activelane/shadcn

Focused Vue UI primitives used by ActiveLane applications and Workbench.

The package contains generic controls and composition primitives only: buttons, form controls,
dialogs, dropdown and context menus, collapsible sections, scroll areas, sidebars, and a small set
of generic presentation components used by current products. Product state, Workbench contracts,
extension behavior, persistence, and host integration do not belong here.

```ts
import '@activelane/shadcn/styles.css'
import { Button, Dialog, DialogContent } from '@activelane/shadcn'
```

The root export is intentional and usage-driven. Generated shadcn components are retained only
when a repository consumer needs them. Icons come from `@activelane/icons`; theme and density are
controlled by semantic CSS tokens in `styles.css`.
