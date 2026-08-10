import { type Component, defineAsyncComponent, markRaw } from 'vue'
import RingSpinner from './custom/RingSpinner'

export type IconComponent = Component

type IconModule = Record<string, unknown>

const modules = {
  lucide: () => import('./lucide'),
  custom: () => import('./custom'),
} as const

type IconProvider = keyof typeof modules

const moduleCache = new Map<IconProvider, Promise<IconModule>>()

function loadProvider(provider: IconProvider): Promise<IconModule> {
  const cached = moduleCache.get(provider)
  if (cached) return cached
  const pending = modules[provider]() as Promise<IconModule>
  moduleCache.set(provider, pending)
  return pending
}

function candidateNames(name: string) {
  const pascalCase = name
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return name === pascalCase ? [name] : [name, pascalCase]
}

async function resolveIcon(name: string): Promise<IconComponent> {
  for (const provider of ['custom', 'lucide'] as const) {
    const icons = await loadProvider(provider)
    for (const candidate of candidateNames(name)) {
      const icon = icons[candidate]
      if ((typeof icon === 'object' && icon !== null) || typeof icon === 'function') {
        return markRaw(icon as IconComponent)
      }
    }
  }
  return RingSpinner
}

/** Resolve a semantic icon name without exposing the underlying icon vendor. */
export function getIcon(name: string): IconComponent {
  return markRaw(
    defineAsyncComponent({
      loader: () => resolveIcon(name),
      loadingComponent: RingSpinner,
      errorComponent: RingSpinner,
      delay: 0,
    }),
  )
}

export function getIcons(names: readonly string[]): IconComponent[] {
  return names.map(getIcon)
}
