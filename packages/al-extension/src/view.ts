import {
  VIEW_PROTOCOL,
  type ViewConnectMessage,
  type ViewPortMessage,
  type ViewRequest,
} from './view-protocol'

export * from './view-protocol'

export interface Disposable {
  dispose(): void
}
export interface ActiveLaneTheme {
  kind: string
  tokens: Record<string, string>
}

export class ActiveLaneViewError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ActiveLaneViewError'
  }
}

type ServiceResult<T> = T extends (...args: never[]) => infer TResult ? Awaited<TResult> : unknown

export type ActiveLaneServiceClient<TService extends object> = {
  call<TKey extends keyof TService & string>(
    method: TKey,
    ...args: TService[TKey] extends (...args: infer TArguments) => unknown ? TArguments : never
  ): Promise<ServiceResult<TService[TKey]>>
}

export interface ActiveLaneViewClient {
  view: {
    getContext<T = unknown>(): Promise<T>
    setTitle(title: string): Promise<void>
    setDirty(dirty: boolean): Promise<void>
    close(): Promise<void>
  }
  commands: { execute<T = unknown>(command: string, args?: unknown): Promise<T> }
  services: {
    call<T = unknown>(service: string, method: string, ...args: unknown[]): Promise<T>
    get<TService extends object>(service: string): ActiveLaneServiceClient<TService>
  }
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
  onDispose(listener: () => void): Disposable
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
  const disposeListeners = new Set<() => void>()
  let disposed = false

  channel.port1.onmessage = (event: MessageEvent<ViewPortMessage>) => {
    const message = event.data
    if (!message || message.protocol !== VIEW_PROTOCOL) return
    if (message.type === 'response') {
      const request = pending.get(message.id)
      if (!request) return
      pending.delete(message.id)
      if (message.error)
        request.reject(new ActiveLaneViewError(message.error.code, message.error.message))
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
      if (disposed)
        return reject(
          new ActiveLaneViewError('CONNECTION_DISPOSED', 'ActiveLane view connection is disposed.'),
        )
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
  const service = <TService extends object>(
    serviceId: string,
  ): ActiveLaneServiceClient<TService> => {
    const invoke = (method: string, args: unknown[]) =>
      call('services.call', { service: serviceId, method, args })
    return {
      call: ((method: string, ...args: unknown[]) =>
        invoke(method, args)) as ActiveLaneServiceClient<TService>['call'],
    }
  }

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
      get: service,
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
    onDispose(listener) {
      disposeListeners.add(listener)
      return { dispose: () => disposeListeners.delete(listener) }
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const listener of disposeListeners) listener()
      disposeListeners.clear()
      for (const request of pending.values())
        request.reject(
          new ActiveLaneViewError('CONNECTION_DISPOSED', 'ActiveLane view connection disposed.'),
        )
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
    throw new ActiveLaneViewError('IDENTITY_MISSING', 'Missing ActiveLane view identity.')
  return { extensionId, definitionId, instanceId }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new ActiveLaneViewError('BRIDGE_TIMEOUT', 'ActiveLane view connection timed out.'),
            ),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
