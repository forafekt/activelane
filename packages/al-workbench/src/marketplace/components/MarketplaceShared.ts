import { getIcon } from '@activelane/icons'
import { type Component, defineComponent, h } from 'vue'
import type { MarketplaceExtension } from '../types/marketplace'

export function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function statusLabel(extension: MarketplaceExtension) {
  if (extension.status === 'update-available') return 'Update'
  if (extension.status === 'enabled') return 'Enabled'
  if (extension.status === 'disabled') return 'Disabled'
  if (extension.status === 'error') return 'Error'
  if (extension.status === 'installed') return 'Installed'
  return 'Available'
}

export function statusTone(
  extension: MarketplaceExtension,
): 'neutral' | 'success' | 'warning' | 'destructive' | 'info' {
  if (extension.status === 'enabled') return 'success'
  if (extension.status === 'update-available') return 'warning'
  if (extension.status === 'error') return 'destructive'
  if (extension.status === 'disabled') return 'neutral'
  return 'info'
}

function isIconSvgFile(value: string) {
  return !isIconSvgRemoteUrl(value) && value.endsWith('.svg')
}
function isIconSvgRemoteUrl(value: string) {
  return value.startsWith('http')
}

export function extensionIcon(extension: MarketplaceExtension): Component {
  if (extension.icon) {
    if (isIconSvgFile(extension.icon)) {
      return defineComponent({
        render() {
          return h('img', { src: extension.icon })
        },
      })
    }

    if (isIconSvgRemoteUrl(extension.icon)) {
      return defineComponent({
        render() {
          // is darkmode?

          const isDark = document.documentElement.classList.contains('dark')

          return h('img', {
            is: 'img',
            src: extension.icon,

            // inherit color
            style: {
              filter: isDark
                ? 'invert(100%) sepia(100%) saturate(0%) hue-rotate(180deg)'
                : undefined,
            },
          })
        },
      })
    }

    // return extension.icon
    // ensure irst letter uppercase
    const fallback = getIcon(extension.icon)

    if (fallback) return fallback
    throw new Error(`Could not find icon for extension ${extension.id}`)
  }

  // throw new Error(`No icon found for extension ${extension.id}`)
  return getIcon('puzzle')

  // if (extension.status === 'disabled') return Layers3
  // if (extension.status === 'error') return AlertCircle
  // if (extension.status === 'update-available') return RefreshCcw
  // if (extension.featured) return Star
  // if (extension.recommended) return Sparkles
  // if (extension.installState === 'installed') return Check
  // return Layers3
}

export function primaryAction(extension: MarketplaceExtension) {
  if (extension.installState === 'not-installed')
    return extension.compatibility === 'incompatible' || extension.versionStatus === 'yanked'
      ? { label: 'Unavailable', action: 'details' as const, variant: 'outline' as const }
      : { label: 'Install', action: 'install' as const, variant: 'default' as const }
  if (extension.status === 'disabled')
    return { label: 'Enable', action: 'enable' as const, variant: 'default' as const }
  if (extension.updateAvailable)
    return { label: 'Update', action: 'update' as const, variant: 'secondary' as const }
  if (extension.status === 'enabled')
    return { label: 'Disable', action: 'disable' as const, variant: 'outline' as const }
  if (extension.status === 'error')
    return { label: 'Settings', action: 'settings' as const, variant: 'outline' as const }
  return { label: 'Manage', action: 'details' as const, variant: 'outline' as const }
}
