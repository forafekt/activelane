import type { ActiveLaneCapability, ActiveLaneCapabilityRecord } from '../capabilities/types'
import type { InstalledExtensionRecord, MarketplaceExtensionRecord } from '../extensions/types'
import type {
  MarketplaceGetListingResponse,
  MarketplaceListInput,
  MarketplaceListInstalledResponse,
  MarketplaceListListingsResponse,
} from '../marketplace/contracts'
import { marketplaceRoutes } from '../marketplace/contracts'
import type {
  RegistryBlockVersionResponse,
  RegistryCreatePublisherRequest,
  RegistryCreatePublisherResponse,
  RegistryErrorResponse,
  RegistryGetExtensionResponse,
  RegistryGetVersionResponse,
  RegistryHealthResponse,
  RegistryListExtensionsQuery,
  RegistryListExtensionsResponse,
  RegistryListInstalledExtensionsResponse,
  RegistryListPublishersResponse,
  RegistryListVersionsResponse,
  RegistryPublishExtensionResponse,
  RegistryYankVersionResponse,
} from '../registry/contracts'
import { registryMethods, registryRoutes } from '../registry/contracts'
import type { WorkbenchSettingEntry } from '../workbench/settings'
import type { WorkbenchRuntimeApi } from './types'

export interface WorkbenchApiHttpClientOptions {
  baseUrl?: string
  fetch?: typeof globalThis.fetch
  credentials?: RequestCredentials
  headers?: HeadersInit
}

export const DEFAULT_WORKBENCH_API_BASE_URL = ''

export type WorkbenchApiResponseType = 'auto' | 'json' | 'text' | 'bytes' | 'void'

export interface WorkbenchApiRequestOptions {
  method?: string
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  headers?: HeadersInit
  credentials?: RequestCredentials
  signal?: AbortSignal
  responseType?: WorkbenchApiResponseType
}

export class WorkbenchApiNetworkError extends Error {
  constructor(
    message: string,
    readonly cause: unknown,
  ) {
    super(message)
    this.name = 'WorkbenchApiNetworkError'
  }
}

export class WorkbenchApiHttpError extends Error {
  constructor(
    message: string,
    readonly response: Response,
    readonly body: unknown,
    readonly registryError?: RegistryErrorResponse['error'],
  ) {
    super(message)
    this.name = 'WorkbenchApiHttpError'
  }
}

export class WorkbenchApiResponseParseError extends Error {
  constructor(
    message: string,
    readonly response: Response,
    readonly bodyText: string,
    readonly cause: unknown,
  ) {
    super(message)
    this.name = 'WorkbenchApiResponseParseError'
  }
}

export class WorkbenchApiHttpClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof globalThis.fetch
  private readonly credentials?: RequestCredentials
  private readonly defaultHeaders: HeadersInit | undefined

  constructor(options: WorkbenchApiHttpClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_WORKBENCH_API_BASE_URL).replace(/\/$/, '')
    this.fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis)
    this.credentials = options.credentials
    this.defaultHeaders = options.headers
    if (!this.fetchImpl)
      throw new Error('A fetch implementation is required to use WorkbenchApiHttpClient.')
  }

  health() {
    return this.request<RegistryHealthResponse>(registryRoutes.health, {
      method: registryMethods.health,
    })
  }

  listMarketplaceListings(input: MarketplaceListInput = {}) {
    return this.request<MarketplaceListListingsResponse>(marketplaceRoutes.listListings, {
      query: {
        search: input.search,
        category: input.category,
        pricing: input.pricing,
        installed: input.installed,
      },
    })
  }

  getMarketplaceListing(id: string) {
    return this.request<MarketplaceGetListingResponse>(marketplaceRoutes.getListing(id))
  }

  async listMarketplaceExtensions() {
    const listings = await this.listMarketplaceListings()
    return listings.map((listing): MarketplaceExtensionRecord => {
      const manifest = listing.manifest
      if (!manifest) {
        throw new Error(`Marketplace listing is missing manifest: ${listing.id}`)
      }
      return {
        id: listing.extensionId,
        slug: listing.id,
        name: manifest.name,
        displayName: listing.title,
        description: listing.summary ?? listing.description,
        version: listing.version ?? manifest.version,
        publisher: {
          id: listing.publisherId,
          name: listing.publisherId,
          verified: listing.publisherId === 'activelane',
        },
        categories: listing.categories,
        tags: listing.tags,
        icon: listing.icon,
        screenshots: listing.screenshots,
        readme: listing.description,
        manifest,
        package: {
          type: 'marketplace',
          source: listing.packageUrl ?? '',
        },
        capabilities: manifest.capabilities,
        createdAt: listing.createdAt ?? listing.updatedAt ?? new Date(0).toISOString(),
        updatedAt: listing.updatedAt ?? listing.createdAt ?? new Date(0).toISOString(),
      }
    })
  }

  getMarketplaceExtension(id: string) {
    return this.request<MarketplaceExtensionRecord>(`/v1/extensions/${encodeURIComponent(id)}`)
  }

  listInstalledExtensions() {
    return this.request<MarketplaceListInstalledResponse>(registryRoutes.listInstalledExtensions)
  }

  installExtension(extensionId: string) {
    return this.request<InstalledExtensionRecord>(registryRoutes.installExtension, {
      method: registryMethods.installExtension,
      body: { extensionId },
    })
  }

  installLocalExtensionPackage(
    input: string | { filePath?: string; fileName?: string; contents?: string; enabled?: boolean },
    enabled = true,
  ) {
    const body =
      typeof input === 'string'
        ? { filePath: input, enabled }
        : {
            filePath: input.filePath,
            fileName: input.fileName,
            contents: input.contents,
            enabled: input.enabled ?? true,
          }
    return this.request<InstalledExtensionRecord>('/v1/extensions/install-local-package', {
      method: 'POST',
      body,
    })
  }

  uninstallExtension(extensionId: string) {
    return this.request<{ ok: true }>(registryRoutes.uninstallExtension, {
      method: registryMethods.uninstallExtension,
      body: { extensionId },
    })
  }

  enableExtension(extensionId: string) {
    return this.request<InstalledExtensionRecord>(registryRoutes.enableExtension, {
      method: registryMethods.enableExtension,
      body: { extensionId },
    })
  }

  disableExtension(extensionId: string) {
    return this.request<InstalledExtensionRecord>(registryRoutes.disableExtension, {
      method: registryMethods.disableExtension,
      body: { extensionId },
    })
  }

  listCapabilities() {
    return this.request<ActiveLaneCapabilityRecord[]>('/v1/capabilities')
  }

  invokeCapability<TOutput = unknown>(
    capabilityId: string,
    input?: unknown,
    callerExtensionId?: string,
  ) {
    return this.request<TOutput>(`/v1/capabilities/${encodeURIComponent(capabilityId)}/invoke`, {
      method: 'POST',
      body: { input, callerExtensionId },
    })
  }

  listSettings() {
    return this.request<WorkbenchSettingEntry[]>('/v1/settings')
  }

  updateSettings(values: Record<string, unknown>) {
    return this.request<WorkbenchSettingEntry[]>('/v1/settings', {
      method: 'POST',
      body: values,
    })
  }

  listEvents() {
    return this.request<unknown[]>('/v1/events')
  }

  getSimulatedAi() {
    return this.request<ActiveLaneCapabilityRecord[]>('/v1/ai/simulated')
  }

  getSimulatedMcp() {
    return this.request<ActiveLaneCapabilityRecord[]>('/v1/mcp/simulated')
  }

  listRegistryExtensions(query: RegistryListExtensionsQuery = {}) {
    return this.request<RegistryListExtensionsResponse>(registryRoutes.listExtensions, {
      method: registryMethods.listExtensions,
      query: { ...query },
    })
  }

  listRegistryInstalledExtensions() {
    return this.request<RegistryListInstalledExtensionsResponse>(
      registryRoutes.listInstalledExtensions,
      {
        method: registryMethods.listInstalledExtensions,
      },
    )
  }

  listRegistryCapabilities() {
    return this.request<ActiveLaneCapability[]>(registryRoutes.listCapabilities, {
      method: registryMethods.listCapabilities,
    })
  }

  searchRegistryExtensions(search: string) {
    return this.listRegistryExtensions({ search })
  }

  getRegistryExtension(publisher: string, name: string) {
    return this.request<RegistryGetExtensionResponse>(
      registryRoutes.getExtension(publisher, name),
      {
        method: registryMethods.getExtension,
      },
    )
  }

  listRegistryVersions(publisher: string, name: string) {
    return this.request<RegistryListVersionsResponse>(
      registryRoutes.listVersions(publisher, name),
      {
        method: registryMethods.listVersions,
      },
    )
  }

  getRegistryVersion(publisher: string, name: string, version: string) {
    return this.request<RegistryGetVersionResponse>(
      registryRoutes.getVersion(publisher, name, version),
      { method: registryMethods.getVersion },
    )
  }

  publishRegistryExtension(bytes: Uint8Array | ArrayBuffer) {
    return this.request<RegistryPublishExtensionResponse>(registryRoutes.publishExtension, {
      method: registryMethods.publishExtension,
      body: bytes,
      headers: { 'content-type': 'application/octet-stream' },
    })
  }

  yankRegistryVersion(publisher: string, name: string, version: string) {
    return this.request<RegistryYankVersionResponse>(
      registryRoutes.yankVersion(publisher, name, version),
      { method: registryMethods.yankVersion },
    )
  }

  blockRegistryVersion(publisher: string, name: string, version: string) {
    return this.request<RegistryBlockVersionResponse>(
      registryRoutes.blockVersion(publisher, name, version),
      { method: registryMethods.blockVersion },
    )
  }

  listRegistryPublishers() {
    return this.request<RegistryListPublishersResponse>(registryRoutes.publishers, {
      method: registryMethods.listPublishers,
    })
  }

  createRegistryPublisher(input: RegistryCreatePublisherRequest) {
    return this.request<RegistryCreatePublisherResponse>(registryRoutes.publishers, {
      method: registryMethods.createPublisher,
      body: input,
    })
  }

  async request<T>(path: string, init: WorkbenchApiRequestOptions = {}): Promise<T> {
    if (path.endsWith('/')) path = path.slice(0, -1)
    const { body, headers } = serializeBody(init.body, init.headers)
    let response: Response
    try {
      response = await this.fetchImpl(buildUrl(this.baseUrl, path, init.query), {
        method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
        headers: mergeHeaders(this.defaultHeaders, headers),
        body,
        credentials: init.credentials ?? this.credentials,
        signal: init.signal,
      })
    } catch (error) {
      throw new WorkbenchApiNetworkError(
        'Workbench API request failed before a response was received.',
        error,
      )
    }
    if (!response.ok) {
      const parsed = await parseErrorBody(response)
      throw new WorkbenchApiHttpError(
        formatHttpError(response.status, parsed.body, parsed.registryError),
        response,
        parsed.body,
        parsed.registryError,
      )
    }
    return (await parseResponse(response, init.responseType ?? 'auto')) as T
  }
}

export function createWorkbenchApiHttpClient(options?: WorkbenchApiHttpClientOptions) {
  return new WorkbenchApiHttpClient(options)
}

export function createWorkbenchRuntimeHttpClient(runtime: WorkbenchRuntimeApi) {
  return new WorkbenchApiHttpClient({
    baseUrl: runtime.host.capabilities.config?.apiBaseUrl ?? 'http://127.0.0.1:4877',
    fetch: runtime.host.capabilities.network?.fetch,
  })
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: WorkbenchApiRequestOptions['query'],
): string {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${url}${url.includes('?') ? '&' : '?'}${search}` : url
}

function serializeBody(
  body: unknown,
  headersInit?: HeadersInit,
): { body?: BodyInit; headers: Headers } {
  const headers = new Headers(headersInit)
  if (body === undefined) return { headers }
  if (typeof body === 'string') return { body, headers }
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return { body: toBodyInit(body), headers }
  }
  if (body instanceof Blob || body instanceof FormData || body instanceof URLSearchParams) {
    return { body, headers }
  }
  if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  return { body: JSON.stringify(body), headers }
}

function toBodyInit(body: ArrayBuffer | ArrayBufferView): BodyInit {
  if (body instanceof ArrayBuffer) return body
  return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer
}

function mergeHeaders(defaultHeaders: HeadersInit | undefined, requestHeaders: Headers): Headers {
  const headers = new Headers(defaultHeaders)
  requestHeaders.forEach((value, key) => {
    headers.set(key, value)
  })
  return headers
}

async function parseResponse(response: Response, responseType: WorkbenchApiResponseType) {
  if (response.status === 204 || response.status === 205) return undefined
  if (responseType === 'void') {
    await response.body?.cancel()
    return undefined
  }
  if (responseType === 'bytes') return new Uint8Array(await response.arrayBuffer())
  if (responseType === 'text') return response.text()
  const contentType = response.headers.get('content-type') ?? ''
  if (responseType === 'auto' && !contentType.includes('json')) {
    if (contentType.startsWith('text/')) return response.text()
    if (contentType.includes('octet-stream')) return new Uint8Array(await response.arrayBuffer())
  }
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new WorkbenchApiResponseParseError(
      'Workbench API returned invalid JSON.',
      response,
      text,
      error,
    )
  }
}

async function parseErrorBody(response: Response): Promise<{
  body: unknown
  registryError?: RegistryErrorResponse['error']
}> {
  const text = await response.text()
  if (!text) return { body: undefined }
  try {
    const body = JSON.parse(text) as RegistryErrorResponse
    return { body, registryError: body.error }
  } catch {
    return { body: text }
  }
}

function formatHttpError(
  status: number,
  body: unknown,
  registryError?: RegistryErrorResponse['error'],
): string {
  if (registryError?.message) {
    return registryError.code
      ? `${registryError.code}: ${registryError.message}`
      : registryError.message
  }
  if (typeof body === 'string' && body) return body
  return `Workbench API request failed: ${status}`
}
