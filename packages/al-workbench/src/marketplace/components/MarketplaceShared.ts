import { getIcon, isIconReference } from '@activelane/icons'
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
  return (value.startsWith('/') || value.startsWith('data:')) && value.endsWith('.svg')
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
          return h('img', {
            src: extension.icon,
            alt: '',
            loading: 'lazy',
          })
        },
      })
    }

    if (isIconReference(extension.icon)) return getIcon(extension.icon)
  }

  return getIcon('lucide:puzzle')
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
    return { label: 'Open', action: 'open' as const, variant: 'default' as const }
  if (extension.status === 'error')
    return { label: 'Settings', action: 'settings' as const, variant: 'outline' as const }
  return { label: 'Manage', action: 'details' as const, variant: 'outline' as const }
}
