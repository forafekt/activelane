# @activelane/icons

Provider-neutral Vue icon exports for ActiveLane packages and apps.

Lucide is the first provider. Consumers should import icons from `@activelane/icons`
instead of depending on provider packages directly:

```ts
import { getIcons } from '@activelane/icons'

const [Search, Settings2] = getIcons(['Search', 'Settings2'])
```

Provider packages stay behind this package boundary so future icon sets can be
registered without changing app-level imports.
