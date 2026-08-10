import type { ActiveLaneExtensionManifest, InstalledExtensionRecord } from '../extensions/types'

export const marketplaceRoutePatterns = {
  listListings: '/v1/marketplace/listings',
  getListing: '/v1/marketplace/listings/:id',
  checkEntitlement: '/v1/entitlements/check',
} as const

export const marketplaceRoutes = {
  listListings: marketplaceRoutePatterns.listListings,
  getListing: (id: string) => `/v1/marketplace/listings/${encodeURIComponent(id)}`,
  checkEntitlement: marketplaceRoutePatterns.checkEntitlement,
} as const

export interface ExtensionManifest {
  id: string
  name: string
  version: string
  publisher: string
  description?: string
  icon?: string
  categories?: string[]
  contributes?: Record<string, unknown>
  commerce?: ExtensionCommerceManifest
}

export interface ExtensionCommerceManifest {
  pricing?: MarketplacePricing
}

export interface MarketplaceListing {
  id: string
  extensionId: string
  packageId?: string
  publisherId: string
  title: string
  summary?: string
  description?: string
  icon?: string
  screenshots?: string[]
  categories: string[]
  tags: string[]
  pricing: MarketplacePricing
  manifest?: ActiveLaneExtensionManifest
  status: 'draft' | 'published' | 'suspended'
  visibility: 'public' | 'private' | 'unlisted' | 'enterprise'
  version?: string
  packageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export type MarketplacePricing =
  | { model: 'free' }
  | { model: 'one_time'; amount: number; currency: string }
  | { model: 'subscription'; plans: MarketplacePlan[] }
  | { model: 'trial'; trialDays: number; then?: MarketplacePricing }
  | { model: 'enterprise'; contactRequired: true }

export interface MarketplacePlan {
  id: string
  name: string
  amount: number
  currency: string
  interval: 'month' | 'year'
  features?: string[]
}

export interface EntitlementDecision {
  allowed: boolean
  reason?:
    | 'free'
    | 'trial'
    | 'purchased'
    | 'active_subscription'
    | 'enterprise_contract'
    | 'not_purchased'
    | 'expired'
    | 'disabled_by_admin'
    | 'seat_limit_exceeded'
    | 'usage_limit_exceeded'
  upgradeUrl?: string
}

export interface MarketplaceListInput {
  search?: string
  category?: string
  pricing?: MarketplacePricing['model']
  installed?: boolean
}

export type MarketplaceListListingsResponse = MarketplaceListing[]
export type MarketplaceGetListingResponse = MarketplaceListing
export type MarketplaceListInstalledResponse = InstalledExtensionRecord[]

export interface EntitlementCheckRequest {
  extensionId: string
  orgId?: string
  userId?: string
}

export type EntitlementCheckResponse = EntitlementDecision
