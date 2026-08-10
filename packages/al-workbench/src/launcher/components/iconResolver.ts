import { getIcon } from '@activelane/icons'
import type { Component } from 'vue'

export function resolveLauncherIcon(icon: Component | string | undefined) {
  if (!icon) throw new Error('Icon not found')
  if (typeof icon === 'string') return getIcon(icon)
  return icon
}
