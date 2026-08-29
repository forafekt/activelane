import type {
  WorkbenchEntitlementResolution,
  WorkbenchEntitlementService,
  WorkbenchExtensionEntitlements,
  WorkbenchSubscriptionProvider,
} from './types'

const emptyResolution = (extensionId: string): WorkbenchEntitlementResolution => ({
  accountId: '',
  extensionId,
  planId: 'free',
  entitlements: [],
  resolvedAt: new Date(0).toISOString(),
})

export function createEntitlementService(
  provider?: WorkbenchSubscriptionProvider,
): WorkbenchEntitlementService {
  const resolutions = new Map<string, WorkbenchEntitlementResolution>()
  const listeners = new Map<string, Set<(resolution: WorkbenchEntitlementResolution) => void>>()

  async function refresh(extensionId: string) {
    const resolution = provider
      ? await provider.resolveEntitlements(extensionId)
      : emptyResolution(extensionId)
    resolutions.set(extensionId, resolution)
    for (const listener of listeners.get(extensionId) ?? []) listener(resolution)
    return resolution
  }

  function forExtension(extensionId: string): WorkbenchExtensionEntitlements {
    return {
      extensionId,
      has(entitlement) {
        return resolutions.get(extensionId)?.entitlements.includes(entitlement) ?? false
      },
      all() {
        return resolutions.get(extensionId)?.entitlements ?? []
      },
      plan() {
        return resolutions.get(extensionId)?.planId ?? 'free'
      },
      refresh: () => refresh(extensionId),
      onDidChange(listener) {
        const extensionListeners = listeners.get(extensionId) ?? new Set()
        extensionListeners.add(listener)
        listeners.set(extensionId, extensionListeners)
        return { dispose: () => extensionListeners.delete(listener) }
      },
    }
  }

  return { forExtension, refresh }
}
