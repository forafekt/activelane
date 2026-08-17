import type { Disposable } from '../shared/types'

export type WorkbenchSubscriptionStatus = 'active' | 'canceled' | 'expired'

export interface WorkbenchSubscription {
  id: string
  accountId: string
  extensionId: string
  planId: string
  status: WorkbenchSubscriptionStatus
  provider: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface WorkbenchEntitlementResolution {
  accountId: string
  extensionId: string
  planId: string
  subscriptionId?: string
  entitlements: string[]
  resolvedAt: string
}

/** Implemented by the host; registry transport details stay out of extensions. */
export interface WorkbenchSubscriptionProvider {
  getSubscription(extensionId: string): Promise<WorkbenchSubscription | undefined>
  subscribe(extensionId: string, planId: string): Promise<WorkbenchSubscription>
  changePlan(extensionId: string, planId: string): Promise<WorkbenchSubscription>
  cancel(extensionId: string): Promise<WorkbenchSubscription>
  resume(extensionId: string): Promise<WorkbenchSubscription>
  resolveEntitlements(extensionId: string): Promise<WorkbenchEntitlementResolution>
}

export interface WorkbenchExtensionEntitlements {
  readonly extensionId: string
  has(entitlement: string): boolean
  all(): readonly string[]
  plan(): string
  refresh(): Promise<WorkbenchEntitlementResolution>
  onDidChange(listener: (resolution: WorkbenchEntitlementResolution) => void): Disposable
}

export interface WorkbenchEntitlementService {
  forExtension(extensionId: string): WorkbenchExtensionEntitlements
  refresh(extensionId: string): Promise<WorkbenchEntitlementResolution>
}
