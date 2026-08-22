import type { ExtensionContext } from '@activelane/extension'
import { reactive } from 'vue'
import {
  API_STUDIO_ENTITLEMENTS,
  type ApiCollection,
  type ApiEnvironment,
  type ApiRequest,
  type ApiStudioState,
  type RequestHistoryEntry,
  resolveVariables,
} from './model'

const STATE_KEY = 'api-studio.state.v2'
const FREE_HISTORY_LIMIT = 25

export interface ApiResponseSnapshot {
  status: number
  statusText: string
  durationMs: number
  sizeBytes: number
  headers: Array<{ key: string; value: string }>
  body: string
  contentType: string
  error?: string
}

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function makeRequest(
  requestId: string,
  collectionId: string,
  name: string,
  method: ApiRequest['method'],
  url: string,
): ApiRequest {
  return {
    id: requestId,
    collectionId,
    name,
    method,
    url,
    query: [],
    headers: [],
    body: { type: 'none', value: '' },
  }
}

function initialState(): ApiStudioState {
  const collectionId = 'collection-example'
  return {
    collections: [
      {
        id: collectionId,
        name: 'Example API',
        requests: [
          makeRequest('request-users', collectionId, 'List Users', 'GET', '{{baseUrl}}/users'),
          makeRequest('request-user', collectionId, 'Get User', 'GET', '{{baseUrl}}/users/1'),
          makeRequest('request-create', collectionId, 'Create User', 'POST', '{{baseUrl}}/users'),
        ],
      },
      { id: 'collection-mine', name: 'My APIs', requests: [] },
    ],
    environments: [
      {
        id: 'environment-development',
        name: 'Development',
        variables: { baseUrl: 'http://127.0.0.1:8787' },
      },
    ],
    activeEnvironmentId: 'environment-development',
    history: [],
  }
}

export class ApiStudioStore {
  readonly state = reactive<ApiStudioState>(initialState())
  readonly responses = reactive<Record<string, ApiResponseSnapshot | undefined>>({})
  selectedRequestId: string | null = null

  constructor(readonly context: ExtensionContext) {}

  async load() {
    const saved = await this.context.storage.get<ApiStudioState>(STATE_KEY)
    if (saved) Object.assign(this.state, saved)
    return this.state
  }

  allRequests() {
    return this.state.collections.flatMap((collection) => collection.requests)
  }
  findRequest(requestId: string) {
    return this.allRequests().find((item) => item.id === requestId)
  }
  activeEnvironment() {
    return this.state.environments.find((item) => item.id === this.state.activeEnvironmentId)
  }

  resolvedUrl(item: ApiRequest) {
    const base = resolveVariables(item.url, this.activeEnvironment())
    const enabled = item.query.filter((entry) => entry.enabled && entry.key)
    if (!enabled.length) return base
    const query = enabled
      .map(
        (entry) =>
          `${encodeURIComponent(entry.key)}=${encodeURIComponent(resolveVariables(entry.value, this.activeEnvironment()))}`,
      )
      .join('&')
    return `${base}${base.includes('?') ? '&' : '?'}${query}`
  }

  openRequest(requestId: string, preview = false) {
    const item = this.findRequest(requestId)
    if (!item) return
    this.selectedRequestId = requestId
    this.context.workbench.openTab(
      {
        id: `api-studio.request.${requestId}`,
        kind: 'api-studio.request',
        title: `${item.method} ${item.name}`,
        icon: 'lucide:globe-2',
        ownerExtensionId: this.context.extensionId,
        input: { requestId },
        preview,
      },
      {
        mode: preview ? 'preview' : 'persistent',
        source: preview ? 'single-click' : 'double-click',
      },
    )
  }

  async newCollection(name = 'New Collection') {
    const collection: ApiCollection = { id: id('collection'), name, requests: [] }
    this.state.collections.push(collection)
    await this.save()
    return collection
  }

  async newRequest(collectionId?: string) {
    const collection =
      this.state.collections.find((item) => item.id === collectionId) ??
      this.state.collections[0] ??
      (await this.newCollection())
    const item = makeRequest(
      id('request'),
      collection.id,
      'Untitled Request',
      'GET',
      '{{baseUrl}}/',
    )
    collection.requests.push(item)
    await this.save()
    this.openRequest(item.id)
    return item
  }

  async duplicateRequest(requestId: string) {
    const source = this.findRequest(requestId)
    const collection =
      source && this.state.collections.find((item) => item.id === source.collectionId)
    if (!source || !collection) return
    const copy = structuredClone(source)
    copy.id = id('request')
    copy.name = `${source.name} Copy`
    collection.requests.push(copy)
    await this.save()
    this.openRequest(copy.id)
  }

  async deleteRequest(requestId: string) {
    for (const collection of this.state.collections) {
      const index = collection.requests.findIndex((item) => item.id === requestId)
      if (index >= 0) collection.requests.splice(index, 1)
    }
    await this.save()
  }

  async deleteCollection(collectionId: string) {
    const collection = this.state.collections.find((item) => item.id === collectionId)
    if (!collection) return
    const accepted = await this.context.host.capabilities.confirm?.({
      title: `Delete “${collection.name}”?`,
      message: `This will remove ${collection.requests.length} saved request${collection.requests.length === 1 ? '' : 's'}.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    })
    if (!accepted) return
    this.state.collections.splice(this.state.collections.indexOf(collection), 1)
    await this.save()
  }

  async renameRequest(requestId: string, name: string) {
    const item = this.findRequest(requestId)
    if (item && name.trim()) item.name = name.trim()
    await this.save()
  }

  async addEnvironment(environment: ApiEnvironment) {
    if (
      !this.context.entitlements.has(API_STUDIO_ENTITLEMENTS.unlimitedEnvironments) &&
      this.state.environments.length >= 1
    ) {
      await this.proRequired('Unlimited environments are available with API Studio Pro.')
      return false
    }
    this.state.environments.push(environment)
    await this.save()
    return true
  }

  async selectEnvironment(environmentId: string) {
    this.state.activeEnvironmentId = environmentId
    await this.save()
  }

  async send(requestId: string) {
    const item = this.findRequest(requestId)
    if (!item) return
    const started = performance.now()
    const url = this.resolvedUrl(item)
    try {
      const headers = new Headers()
      for (const header of item.headers)
        if (header.enabled && header.key)
          headers.set(header.key, resolveVariables(header.value, this.activeEnvironment()))
      if (item.body.type === 'json' && !headers.has('content-type'))
        headers.set('content-type', 'application/json')
      const requestBody =
        item.body.type === 'none' || item.method === 'GET' || item.method === 'HEAD'
          ? undefined
          : resolveVariables(item.body.value, this.activeEnvironment())
      const hostRequest = this.context.host.capabilities.network?.request
      if (hostRequest) {
        const requestHeaders: Record<string, string> = {}
        headers.forEach((value, key) => {
          requestHeaders[key] = value
        })
        const response = await hostRequest({
          method: item.method,
          url,
          headers: requestHeaders,
          body: requestBody,
        })
        const contentType =
          Object.entries(response.headers).find(
            ([key]) => key.toLowerCase() === 'content-type',
          )?.[1]?.[0] ?? ''
        let body = response.body
        if (contentType.includes('json')) {
          try {
            body = JSON.stringify(JSON.parse(body), null, 2)
          } catch {
            /* retain malformed JSON */
          }
        }
        const responseHeaders = Object.entries(response.headers).flatMap(([key, values]) =>
          values.map((value) => ({ key, value })),
        )
        const snapshot: ApiResponseSnapshot = {
          status: response.status,
          statusText: response.statusText,
          durationMs: Math.max(1, response.durationMs),
          sizeBytes: response.sizeBytes,
          headers: responseHeaders,
          body,
          contentType,
        }
        this.responses[requestId] = snapshot
        await this.recordHistory({
          id: id('history'),
          requestId,
          requestName: item.name,
          method: item.method,
          url,
          timestamp: new Date().toISOString(),
          responseStatus: response.status,
          durationMs: snapshot.durationMs,
        })
        return snapshot
      }
      const response = await (this.context.host.capabilities.network?.fetch ?? fetch)(url, {
        method: item.method,
        headers,
        body: requestBody,
      })
      const raw = await response.text()
      const durationMs = Math.max(1, Math.round(performance.now() - started))
      const contentType = response.headers.get('content-type') ?? ''
      let body = raw
      if (contentType.includes('json')) {
        try {
          body = JSON.stringify(JSON.parse(raw), null, 2)
        } catch {
          /* retain malformed JSON */
        }
      }
      const responseHeaders: Array<{ key: string; value: string }> = []
      response.headers.forEach((value, key) => {
        responseHeaders.push({ key, value })
      })
      const snapshot: ApiResponseSnapshot = {
        status: response.status,
        statusText: response.statusText,
        durationMs,
        sizeBytes: new TextEncoder().encode(raw).byteLength,
        headers: responseHeaders,
        body,
        contentType,
      }
      this.responses[requestId] = snapshot
      await this.recordHistory({
        id: id('history'),
        requestId,
        requestName: item.name,
        method: item.method,
        url,
        timestamp: new Date().toISOString(),
        responseStatus: response.status,
        durationMs,
      })
      return snapshot
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.responses[requestId] = {
        status: 0,
        statusText: 'Request failed',
        durationMs: Math.round(performance.now() - started),
        sizeBytes: 0,
        headers: [],
        body: message,
        contentType: 'text/plain',
        error: message,
      }
      await this.context.host.capabilities.notify?.({
        title: 'Request failed',
        message,
        tone: 'error',
      })
      return this.responses[requestId]
    }
  }

  async recordHistory(entry: RequestHistoryEntry) {
    this.state.history.unshift(entry)
    if (!this.context.entitlements.has(API_STUDIO_ENTITLEMENTS.unlimitedHistory))
      this.state.history.splice(FREE_HISTORY_LIMIT)
    await this.save()
  }

  async clearHistory() {
    this.state.history.splice(0)
    await this.save()
  }
  async save() {
    const serializable = JSON.parse(JSON.stringify(this.state)) as ApiStudioState
    await this.context.storage.set(STATE_KEY, serializable)
  }

  private async proRequired(message: string) {
    const viewPlans = await this.context.host.capabilities.confirm?.({
      title: 'API Studio Pro required',
      message,
      confirmLabel: 'View plans',
      cancelLabel: 'Not now',
    })
    if (viewPlans) await this.context.commands.execute('api-studio.open-marketplace')
  }
}
