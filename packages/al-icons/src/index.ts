import { type Component, defineAsyncComponent, markRaw } from 'vue'
import RingSpinner from './custom/RingSpinner'
// import * as customIcons from './custom'
// import * as lucideIcons from './lucide'

export type IconComponent = Component
export type IconProviderId = 'lucide' | 'custom'
export type IconProviderInput = IconProvider | IconProviderId
export type IconRegistry = Map<string, IconComponent>

export interface IconProvider {
  id: IconProviderId
  icons: IconRegistry
  get: (name: string) => IconComponent | undefined
  has: (name: string) => boolean
  set: (name: string, component: IconComponent) => void
}

function createIconRegistry(icons: Record<string, unknown>): IconRegistry {
  const entries = Object.entries(icons).filter(
    ([name, value]) =>
      name !== 'default' &&
      ((typeof value === 'object' && value !== null) || typeof value === 'function'),
  ) as Array<[string, IconComponent]>

  return new Map(entries.map(([name, component]) => [name, markRaw(component)]))
}

export function createIconProvider(
  id: IconProviderId,
  icons: Record<string, unknown>,
): IconProvider {
  const registry = createIconRegistry(icons)
  return {
    id,
    icons: registry,
    get: (name) => registry.get(name),
    has: (name) => registry.has(name),
    set: (name, component) => registry.set(name, markRaw(component)),
  }
}

export const iconRegistry = createIconRegistry({})

// export const lucideIconProvider = createIconProvider('lucide', lucideIcons)
// export const defaultIconProvider = lucideIconProvider
// export const iconRegistry = defaultIconProvider.icons

// export const iconProviders = {
//   lucide: createIconProvider('lucide', lucideIcons),
//   custom: createIconProvider('custom', customIcons),
// }

type Lucide = typeof import('./lucide')
type LucideName = keyof Lucide

type Custom = typeof import('./custom')
type CustomName = keyof Custom

export type IconProviderIdType = LucideName | CustomName

export function getIcon(name: string, providerInput: IconProviderInput = 'lucide'): Component {
  return markRaw(
    defineAsyncComponent({
      loader: async () => {
        const iconProviders = {
          lucide: createIconProvider('lucide', await import('./lucide')),
          custom: createIconProvider('custom', await import('./custom')),
        }

        const provider: IconProvider =
          typeof providerInput === 'string' ? iconProviders[providerInput] : providerInput

        const firstCharUpper = name.charAt(0).toUpperCase()
        const upperCaseFirst = firstCharUpper + name.slice(1)
        const camelCase =
          firstCharUpper + name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).slice(1)

        return (
          provider.get(name) ||
          provider.get(upperCaseFirst) ||
          provider.get(camelCase) ||
          RingSpinner
        )
      },

      loadingComponent: RingSpinner,
      errorComponent: RingSpinner,
      delay: 0,
    }),
  )
}
export function getIcons(names: string[], provider: IconProviderInput = 'lucide') {
  return names.map((name) => getIcon(name, provider)) as IconComponent[]
}

export function registerIcon(name: string, component: IconComponent) {
  const firstChaUpper = name.charAt(0).toUpperCase()
  const upperCaseFirst = firstChaUpper + name.slice(1)
  const camelCase = firstChaUpper + name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).slice(1)
  const rawComponent = markRaw(component)
  iconRegistry.set(name, rawComponent)
  iconRegistry.set(upperCaseFirst, rawComponent)
  iconRegistry.set(camelCase, rawComponent)
}
