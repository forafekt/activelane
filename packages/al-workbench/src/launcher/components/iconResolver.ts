import { getIcon } from '@activelane/icons'
import type { Component } from 'vue'

// legacy
export function resolveLauncherIcon(icon: Component | string | undefined) {
  if (!icon) throw new Error('Icon not found')
  if (typeof icon === 'string') return getIcon(icon)
  if (!icon.name) throw new Error('Icon not found')
  return getIcon(icon.name)
}
