import {
  createNativeWorkbenchHost,
  createVueExtensionRuntime,
  type ActiveLaneExtensionManifest,
  type InstalledExtensionRecord,
  type WorkbenchHost,
  type WorkbenchSubscription,
} from '@activelane/workbench'
import apiStudioManifest from '../../../../../extensions/api-studio/activelane.manifest.json'
import { createDesktopExtensionCatalog } from './extensions'

export const previewWorkbenchHost: WorkbenchHost = { platform: 'web' }

export async function createDesktopPreviewPlatform() {
  const definition = createDesktopExtensionCatalog().find(
    (entry) => entry.definition.manifest.id === '@activelane/api-studio',
  )?.definition
  if (!definition) throw new Error('API Studio preview definition is unavailable.')
  const installed: InstalledExtensionRecord = {
    id: 'activelane/api-studio',
    extensionId: '@activelane/api-studio',
    displayName: 'ActiveLane API Studio',
    version: definition.manifest.version,
    enabled: true,
    state: 'enabled',
    installSource: 'marketplace',
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    manifest: apiStudioManifest as ActiveLaneExtensionManifest,
    source: { type: 'registry', registryId: 'local' },
  }
  let subscription: WorkbenchSubscription | undefined
  const createSubscription = (planId: string): WorkbenchSubscription => ({
    id: 'preview-api-studio-subscription', accountId: 'desktop-preview', extensionId: '@activelane/api-studio',
    planId, status: 'active', provider: 'development', cancelAtPeriodEnd: false,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
  const resolvePreviewEntitlements = () => {
    const planId = subscription?.planId ?? 'free'
    const plan = apiStudioManifest.marketplace.plans.find((candidate) => candidate.id === planId) ?? apiStudioManifest.marketplace.plans[0]
    return { accountId: 'desktop-preview', extensionId: '@activelane/api-studio', planId, subscriptionId: subscription?.id, entitlements: plan?.entitlements ?? [], resolvedAt: new Date().toISOString() }
  }
  const host = createNativeWorkbenchHost({
    id: 'desktop-preview',
    label: 'ActiveLane Desktop Preview',
    storagePrefix: 'activelane.preview.v1',
    capabilities: {
      network: { fetch: (input, init) => fetch(input, init) },
      notify: async (options) => { console.info(`[${options.tone ?? 'info'}] ${options.title}`, options.message); return undefined },
      confirm: async () => true,
      subscriptions: {
        getSubscription: async () => subscription,
        subscribe: async (_extensionId, planId) => (subscription = createSubscription(planId)),
        changePlan: async (_extensionId, planId) => (subscription = { ...createSubscription(planId), id: subscription?.id ?? 'preview-api-studio-subscription' }),
        cancel: async () => (subscription = { ...(subscription ?? createSubscription('free')), cancelAtPeriodEnd: true }),
        resume: async () => (subscription = { ...(subscription ?? createSubscription('free')), cancelAtPeriodEnd: false }),
        resolveEntitlements: async () => resolvePreviewEntitlements(),
      },
      extensions: {
        listInstalled: async () => [installed],
        install: async () => installed,
        enable: async () => installed,
        disable: async () => ({ ...installed, enabled: false }),
        uninstall: async () => undefined,
      },
      registry: {
        status: async () => ({ registries: [], mode: 'local-only', publicRegistryEnabled: false }),
        search: async () => ({
          items: [{ registryId: 'local', registryDisplayName: 'Local ActiveLane Registry', id: '@activelane/api-studio', namespace: 'activelane', name: 'api-studio', displayName: 'ActiveLane API Studio', description: apiStudioManifest.description, version: apiStudioManifest.version, versionStatus: 'published', manifest: apiStudioManifest as ActiveLaneExtensionManifest, manifestDigest: 'preview', packageDigest: 'preview', publishedAt: new Date().toISOString(), compatible: true }],
          failures: [], mode: 'local-only', publicRegistryEnabled: false,
        }),
      },
    },
  })
  return createVueExtensionRuntime({
    host,
    extensions: createDesktopExtensionCatalog(),
    installedExtensions: [installed],
    runtimeId: 'activelane.desktop.preview',
    initialState: {
      activeActivityId: 'api-studio.activity',
      activeSidebarViewId: 'api-studio.sidebar',
      inspector: { collapsed: false, size: 300, minSize: 240, minExpandedSize: 240, lastExpandedSize: 300, collapseThreshold: 80, maxSize: 520 },
      bottomPanel: { open: true, height: 210, activeViewId: 'api-studio.request-log' },
    },
  })
}
