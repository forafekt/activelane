# @activelane/icons

Semantic Vue icon lookup for ActiveLane packages and apps.

Lucide is the first provider. Consumers should import icons from `@activelane/icons`
instead of depending on provider packages directly:

```ts
import { getIcons } from '@activelane/icons'

const [Search, Settings2] = getIcons(['Search', 'Settings2'])
```

The package owns provider selection and name normalization. Its public API is deliberately
limited to `getIcon`, `getIcons`, and the `IconComponent` type; provider registries are an
implementation detail.
