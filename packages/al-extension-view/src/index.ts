import {
  VIEW_PROTOCOL,
  type ViewConnectMessage,
  type ViewPortMessage,
  type ViewRequest,
} from './protocol'

export * from './protocol'

export interface Disposable {
  dispose(): void
}
export interface ActiveLaneTheme {
  kind: string
  tokens: Record<string, string>
}

export interface ActiveLaneViewClient {
  view: {
    getContext<T = unknown>(): Promise<T>
    setTitle(title: string): Promise<void>
    setDirty(dirty: boolean): Promise<void>
    close(): Promise<void>
  }
  commands: { execute<T = unknown>(command: string, args?: unknown): Promise<T> }
  services: { call<T = unknown>(service: string, method: string, ...args: unknown[]): Promise<T> }
  events: {
    on<T = unknown>(event: string, listener: (value: T) => void): Disposable
    emit<T = unknown>(event: string, value: T): Promise<void>
  }
  storage: {
    get<T = unknown>(key: string): Promise<T | undefined>
    set<T = unknown>(key: string, value: T): Promise<void>
  }
  theme: {
    getCurrent(): Promise<ActiveLaneTheme>
    onDidChange(listener: (theme: ActiveLaneTheme) => void): Disposable
  }
  dispose(): void
}

export interface ConnectViewOptions {
  timeoutMs?: number
  target?: Window
  targetOrigin?: string
}

export async function connectActiveLaneView(
  options: ConnectViewOptions = {},
): Promise<ActiveLaneViewClient> {
  const target = options.target ?? window.parent
  const channel = new MessageChannel()
  const pending = new Map<string, { resolve(value: unknown): void; reject(error: Error): void }>()
  const listeners = new Map<string, Set<(value: unknown) => void>>()
  let disposed = false

  channel.port1.onmessage = (event: MessageEvent<ViewPortMessage>) => {
    const message = event.data
    if (!message || message.protocol !== VIEW_PROTOCOL) return
    if (message.type === 'response') {
      const request = pending.get(message.id)
      if (!request) return
      pending.delete(message.id)
      if (message.error)
        request.reject(new Error(`${message.error.code}: ${message.error.message}`))
      else request.resolve(message.result)
    } else if (message.type === 'event') {
      for (const listener of listeners.get(message.event) ?? []) listener(message.value)
    }
  }
  channel.port1.start()

  const identity = readIdentity(location.hash)
  target.postMessage(
    { protocol: VIEW_PROTOCOL, type: 'connect', identity } satisfies ViewConnectMessage,
    options.targetOrigin ?? '*',
    [channel.port2],
  )

  let sequence = 0
  const call = <T>(method: string, params?: unknown) =>
    new Promise<T>((resolve, reject) => {
      if (disposed) return reject(new Error('ActiveLane view connection is disposed.'))
      const id = `${identity.instanceId}:${++sequence}`
      pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
      channel.port1.postMessage({
        protocol: VIEW_PROTOCOL,
        type: 'request',
        id,
        method,
        params,
      } satisfies ViewRequest)
    })
  const on = <T>(event: string, listener: (value: T) => void): Disposable => {
    const bucket = listeners.get(event) ?? new Set()
    bucket.add(listener as (value: unknown) => void)
    listeners.set(event, bucket)
    return { dispose: () => bucket.delete(listener as (value: unknown) => void) }
  }

  await withTimeout(call('view.ready'), options.timeoutMs ?? 10_000)
  return {
    view: {
      getContext: () => call('view.getContext'),
      setTitle: (title) => call('view.setTitle', { title }),
      setDirty: (dirty) => call('view.setDirty', { dirty }),
      close: () => call('view.close'),
    },
    commands: { execute: (command, args) => call('commands.execute', { command, args }) },
    services: {
      call: (service, method, ...args) => call('services.call', { service, method, args }),
    },
    events: { on, emit: (event, value) => call('events.emit', { event, value }) },
    storage: {
      get: (key) => call('storage.get', { key }),
      set: (key, value) => call('storage.set', { key, value }),
    },
    theme: {
      getCurrent: () => call('theme.getCurrent'),
      onDidChange: (listener) => on('theme.changed', listener),
    },
    dispose() {
      disposed = true
      for (const request of pending.values())
        request.reject(new Error('ActiveLane view connection disposed.'))
      pending.clear()
      listeners.clear()
      channel.port1.close()
    },
  }
}

function readIdentity(hash: string) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ''))
  const extensionId = parameters.get('alExtension')
  const definitionId = parameters.get('alView')
  const instanceId = parameters.get('alInstance')
  if (!extensionId || !definitionId || !instanceId)
    throw new Error('Missing ActiveLane view identity.')
  return { extensionId, definitionId, instanceId }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('ActiveLane view connection timed out.')),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
