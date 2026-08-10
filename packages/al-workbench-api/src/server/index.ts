import type { ActiveLaneCapability, ActiveLaneCapabilityService } from '../capabilities/types'
import type { ActiveLaneExtensionManifest } from '../extensions/types'
import type { ActiveLaneHostKind } from '../runtime/context'
import type { Disposable, MaybePromise } from '../shared/types'

export type ServerExtensionStatus =
  | 'idle'
  | 'starting'
  | 'health-checking'
  | 'running'
  | 'degraded'
  | 'stopping'
  | 'stopped'
  | 'restarting'
  | 'failed'
  | 'disabled'
  /** @deprecated use idle */
  | 'installed'
  /** @deprecated use running */
  | 'ready'

export type ServerExtensionMode = 'in-process' | 'worker' | 'subprocess' | 'container' | 'remote'
export type ServerExtensionRuntime = 'node' | 'deno' | 'bun' | 'python' | 'binary' | 'remote'
export type ServerExtensionStartupMode = 'auto' | 'manual' | 'disabled'
export type ServerExtensionRestartPolicy = 'never' | 'on-failure' | 'always' | 'unless-disabled'
export type ServerExtensionPortStrategy = 'dynamic' | 'fixed' | 'none'
export type ServerLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export interface ServerExtensionHealthDeclaration {
  http?: string
  intervalMs: number
  timeoutMs: number
}

export interface ServerExtensionRestartDeclaration {
  policy: ServerExtensionRestartPolicy
  maxRestarts: number
  windowMs: number
  backoffMs: number
}

export interface ServerExtensionPortsDeclaration {
  strategy: ServerExtensionPortStrategy
  port?: number
  env: string
}

export interface ServerExtensionDeclaration {
  id: string
  label: string
  mode: ServerExtensionMode
  runtime: ServerExtensionRuntime
  entry?: string
  command?: string
  args: string[]
  cwd?: string
  env?: Record<string, string>
  config?: Record<string, unknown>
  startup: ServerExtensionStartupMode
  logChannelId: string
  logBufferSize: number
  autoStart: boolean
  health?: ServerExtensionHealthDeclaration
  restart: ServerExtensionRestartDeclaration
  ports: ServerExtensionPortsDeclaration
  capabilities: string[]
}

export interface ServerExtensionManifestValidationIssue {
  path: string
  message: string
}

export interface ServerExtensionManifestValidationResult {
  ok: boolean
  server?: ServerExtensionDeclaration
  issues: ServerExtensionManifestValidationIssue[]
}

export interface LogQuery {
  since?: number
  limit?: number
  stream?: 'stdout' | 'stderr' | 'system'
}

export interface ExtensionLogEntry {
  timestamp: number
  serverId: string
  extensionId: string
  level: ServerLogLevel
  stream: 'stdout' | 'stderr' | 'system'
  message: string
}

export interface ExtensionMetrics {
  restarts: number
  uptimeMs?: number
  lastExitCode?: number | null
  lastSignal?: string | null
}

export interface ServerRuntimeStatusSnapshot {
  id: string
  extensionId: string
  label: string
  extensionName: string
  status: ServerExtensionStatus
  startup: ServerExtensionStartupMode
  restartPolicy: ServerExtensionRestartPolicy
  pid?: number
  port?: number
  origin?: string
  uptimeMs?: number
  crashCount: number
  lastError?: string
  lastStartTime?: number
  lastStopTime?: number
  lastHealthCheckAt?: number
  unsupportedReason?: string
}

export interface ServerExtensionExit {
  code?: number | null
  signal?: string | null
  error?: string
}

export type ServerExtensionEvent =
  | { type: 'registered'; serverId: string; extensionId: string }
  | { type: 'starting'; serverId: string; extensionId: string }
  | { type: 'health-checking'; serverId: string; extensionId: string }
  | { type: 'running'; serverId: string; extensionId: string; origin?: string }
  | { type: 'ready'; serverId: string; extensionId: string; origin?: string }
  | { type: 'degraded'; serverId: string; extensionId: string; reason: string }
  | { type: 'stopping'; serverId: string; extensionId: string }
  | { type: 'restarting'; serverId: string; extensionId: string }
  | { type: 'failed'; serverId: string; extensionId: string; error: string }
  | { type: 'stopped'; serverId: string; extensionId: string }
  | { type: 'disabled'; serverId: string; extensionId: string }
  | { type: 'log'; serverId: string; extensionId: string; entry: ExtensionLogEntry }

export interface ServerExtensionHandle {
  readonly id: string
  readonly extensionId: string
  readonly manifest: ActiveLaneExtensionManifest
  readonly declaration: ServerExtensionDeclaration
  readonly status: ServerExtensionStatus
  readonly pid?: number
  readonly port?: number
  readonly origin?: string
  readonly startedAt?: number
  readonly lastHealthCheckAt?: number
  readonly lastError?: string
  readonly unsupportedReason?: string
  start(): Promise<void>
  stop(): Promise<void>
  restart(): Promise<void>
  getLogs(options?: LogQuery): Promise<ExtensionLogEntry[]>
  getMetrics(): Promise<ExtensionMetrics>
}

export type ActiveLaneServerStatus = 'created' | 'starting' | 'ready' | 'stopped' | 'failed'

export interface ActiveLaneServerHandle {
  id: string
  kind: 'local' | 'remote' | 'in-process'
  status: ActiveLaneServerStatus
  origin?: string
  startedAt?: number
  stop?: () => Promise<void>
  metadata?: Record<string, unknown>
}

export interface EnsureServerOptions {
  id?: string
  origin?: string
  prefer?: 'local' | 'remote' | 'in-process'
}

export interface CreateServerOptions extends EnsureServerOptions {
  kind?: ActiveLaneServerHandle['kind']
}

export interface RegisterServerExtensionOptions {
  manifest: ActiveLaneExtensionManifest
  server?: unknown
}

export interface ServerExtensionLauncherContext {
  extensionId: string
  manifest: ActiveLaneExtensionManifest
  declaration: ServerExtensionDeclaration
  port?: number
  env: Record<string, string>
  log: (stream: ExtensionLogEntry['stream'], message: string) => void
  onExit: (exit: ServerExtensionExit) => void
}

export interface ServerExtensionLaunchResult {
  pid?: number
  port?: number
  origin?: string
  stop?: () => MaybePromise<void>
  checkHealth?: () => MaybePromise<{ ok: boolean; reason?: string }>
}

export type ServerExtensionLauncher = (
  context: ServerExtensionLauncherContext,
) => MaybePromise<ServerExtensionLaunchResult>

export interface ActiveLaneServerRuntimeOptions {
  hostKind: ActiveLaneHostKind
  capabilities?: ActiveLaneCapabilityService
  launcher?: ServerExtensionLauncher
  now?: () => number
}

export interface ActiveLaneServerRuntime {
  readonly hostKind: ActiveLaneHostKind
  listServers(): ServerExtensionHandle[]
  getServer(id: string): ServerExtensionHandle | undefined
  startServer(id: string): Promise<ServerExtensionHandle>
  stopServer(id: string): Promise<void>
  restartServer(id: string): Promise<ServerExtensionHandle>
  getServerStatus(id: string): ServerRuntimeStatusSnapshot | undefined
  watchServerStatus(listener: (status: ServerRuntimeStatusSnapshot) => void): Disposable
  watchServerLogs(id: string, listener: (entry: ExtensionLogEntry) => void): Disposable
  /** @deprecated use getRuntimeServer */
  getRuntimeServer(id?: string): ActiveLaneServerHandle | undefined
  /** @deprecated use createRuntimeServer */
  ensureServer(options?: EnsureServerOptions): Promise<ActiveLaneServerHandle>
  /** @deprecated use createRuntimeServer */
  createServer(options?: CreateServerOptions): Promise<ActiveLaneServerHandle>
  /** @deprecated use listRuntimeServers */
  listRuntimeServers(): ActiveLaneServerHandle[]
  registerExtension(options: RegisterServerExtensionOptions): ServerExtensionHandle
  /** @deprecated use startServer */
  startExtension(extensionId: string): Promise<ServerExtensionHandle>
  /** @deprecated use stopServer */
  stopExtension(extensionId: string): Promise<void>
  /** @deprecated use restartServer */
  restartExtension(extensionId: string): Promise<ServerExtensionHandle>
  /** @deprecated use getServer */
  getExtension(extensionId: string): ServerExtensionHandle | undefined
  /** @deprecated use listServers */
  listExtensions(): ServerExtensionHandle[]
  /** @deprecated use watchServerStatus/watchServerLogs */
  watchExtension(extensionId: string, listener: (event: ServerExtensionEvent) => void): Disposable
  dispose(): Promise<void>
}

const modes = new Set<ServerExtensionMode>([
  'in-process',
  'worker',
  'subprocess',
  'container',
  'remote',
])
const runtimes = new Set<ServerExtensionRuntime>([
  'node',
  'deno',
  'bun',
  'python',
  'binary',
  'remote',
])
const policies = new Set<ServerExtensionRestartPolicy>([
  'never',
  'on-failure',
  'always',
  'unless-disabled',
])
const portStrategies = new Set<ServerExtensionPortStrategy>(['dynamic', 'fixed', 'none'])
const startupModes = new Set<ServerExtensionStartupMode>(['auto', 'manual', 'disabled'])

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
  path: string,
  issues: ServerExtensionManifestValidationIssue[],
) {
  if (value === undefined) return fallback
  if (typeof value === 'string' && allowed.has(value as T)) return value as T
  issues.push({ path, message: `Unsupported value: ${String(value)}.` })
  return fallback
}

export function normalizeServerExtensionDeclaration(
  input: unknown,
): ServerExtensionManifestValidationResult {
  const issues: ServerExtensionManifestValidationIssue[] = []
  if (input === undefined) return { ok: true, issues: [] }
  if (!isObject(input)) {
    return { ok: false, issues: [{ path: 'server', message: 'server must be an object.' }] }
  }

  const health = isObject(input.health) ? input.health : undefined
  const restart = isObject(input.restart) ? input.restart : {}
  const ports = isObject(input.ports) ? input.ports : {}
  const startup = readEnum(
    input.startup,
    startupModes,
    typeof input.autoStart === 'boolean' ? (input.autoStart ? 'auto' : 'manual') : 'manual',
    'server.startup',
    issues,
  )
  const mode = readEnum(
    input.mode,
    modes,
    asString(input.command) || asString(input.entry) ? 'subprocess' : 'remote',
    'server.mode',
    issues,
  )
  const runtime = readEnum(
    input.runtime,
    runtimes,
    mode === 'remote' ? 'remote' : asString(input.command) === 'python' ? 'python' : 'node',
    'server.runtime',
    issues,
  )

  const declaration: ServerExtensionDeclaration = {
    id: asString(input.id) || 'default',
    label: asString(input.label) || 'Server',
    mode,
    runtime,
    entry: asString(input.entry) || undefined,
    command: asString(input.command) || undefined,
    args: asStringArray(input.args),
    cwd: asString(input.cwd) || undefined,
    env: isObject(input.env) ? (input.env as Record<string, string>) : undefined,
    config: isObject(input.config) ? input.config : undefined,
    startup,
    logChannelId: asString(input.logChannelId) || 'servers',
    logBufferSize: Math.max(100, Math.min(10000, asNumber(input.logBufferSize, 500))),
    autoStart: startup === 'auto',
    health: health
      ? {
          http: asString(health.http) || undefined,
          intervalMs: asNumber(health.intervalMs, 5000),
          timeoutMs: asNumber(health.timeoutMs, 1500),
        }
      : undefined,
    restart: {
      policy: readEnum(restart.policy, policies, 'on-failure', 'server.restart.policy', issues),
      maxRestarts: Math.max(0, asNumber(restart.maxRestarts, 5)),
      windowMs: Math.max(1, asNumber(restart.windowMs, 60000)),
      backoffMs: Math.max(0, asNumber(restart.backoffMs, 1000)),
    },
    ports: {
      strategy: readEnum(
        ports.strategy,
        portStrategies,
        mode === 'remote' ? 'none' : 'dynamic',
        'server.ports.strategy',
        issues,
      ),
      port: asNumber(ports.port, 0) || undefined,
      env: asString(ports.env) || 'ACTIVELANE_EXTENSION_PORT',
    },
    capabilities: asStringArray(input.capabilities),
  }

  if (declaration.mode !== 'remote' && !declaration.entry && !declaration.command) {
    issues.push({
      path: 'server.entry',
      message: 'server.entry or server.command is required for managed local server extensions.',
    })
  }

  return { ok: issues.length === 0, server: issues.length ? undefined : declaration, issues }
}

class ManagedServerExtensionHandle implements ServerExtensionHandle {
  status: ServerExtensionStatus = 'idle'
  pid?: number
  port?: number
  origin?: string
  startedAt?: number
  stoppedAt?: number
  lastHealthCheckAt?: number
  lastError?: string
  unsupportedReason?: string
  private logs: ExtensionLogEntry[] = []
  private restarts = 0
  private crashes = 0
  private restartTimestamps: number[] = []
  private lastExitCode: number | null = null
  private lastSignal: string | null = null
  private stopLaunch?: () => MaybePromise<void>

  private operation: Promise<void> | undefined
  private healthTimer: ReturnType<typeof globalThis.setInterval> | undefined

  constructor(
    readonly id: string,
    readonly extensionId: string,
    readonly manifest: ActiveLaneExtensionManifest,
    readonly declaration: ServerExtensionDeclaration,
    private readonly runtime: ManagedActiveLaneServerRuntime,
  ) {}

  async start() {
    return this.enqueue(async () => {
      await this.startUnlocked()
    })
  }

  private async startUnlocked() {
    if (
      this.status === 'running' ||
      this.status === 'ready' ||
      this.status === 'starting' ||
      this.status === 'health-checking'
    )
      return
    if (this.declaration.startup === 'disabled') {
      this.status = 'disabled'
      this.lastError = 'Server is disabled by manifest or settings.'
      this.appendLog('system', this.lastError, 'warn')
      this.runtime.emit(this.id, {
        type: 'disabled',
        serverId: this.id,
        extensionId: this.extensionId,
      })
      return
    }
    this.lastError = undefined
    this.runtime.emit(this.id, {
      type: 'starting',
      serverId: this.id,
      extensionId: this.extensionId,
    })
    this.status = 'starting'
    this.appendLog('system', `Starting server ${this.id}.`)
    try {
      const launch = await this.runtime.launch(this)
      this.pid = launch.pid
      this.port = launch.port
      this.origin = launch.origin ?? (this.port ? `http://127.0.0.1:${this.port}` : undefined)
      this.stopLaunch = launch.stop
      this.startedAt = this.runtime.now()
      this.stoppedAt = undefined
      if (this.declaration.health || launch.checkHealth) {
        this.status = 'health-checking'
        this.runtime.emit(this.id, {
          type: 'health-checking',
          serverId: this.id,
          extensionId: this.extensionId,
        })
        this.lastHealthCheckAt = this.runtime.now()
        const health = launch.checkHealth ? await launch.checkHealth() : { ok: true }
        if (!health.ok) {
          this.status = 'degraded'
          this.lastError = health.reason ?? 'Health check failed.'
          this.runtime.emit(this.id, {
            type: 'degraded',
            serverId: this.id,
            extensionId: this.extensionId,
            reason: this.lastError,
          })
          return
        }
      }
      this.status = 'running'
      this.runtime.registerCapabilities(this)
      this.scheduleHealthChecks(launch.checkHealth)
      this.runtime.emit(this.id, {
        type: 'running',
        serverId: this.id,
        extensionId: this.extensionId,
        origin: this.origin,
      })
      this.runtime.emit(this.id, {
        type: 'ready',
        serverId: this.id,
        extensionId: this.extensionId,
        origin: this.origin,
      })
    } catch (error) {
      this.status = 'failed'
      this.lastError = error instanceof Error ? error.message : String(error)
      this.appendLog('system', this.lastError, 'error')
      this.runtime.emit(this.id, {
        type: 'failed',
        serverId: this.id,
        extensionId: this.extensionId,
        error: this.lastError,
      })
    }
  }

  async stop() {
    return this.enqueue(async () => {
      await this.stopUnlocked()
    })
  }

  private async stopUnlocked() {
    if (this.status === 'stopped' || this.status === 'stopping') return
    this.status = 'stopping'
    this.runtime.emit(this.id, {
      type: 'stopping',
      serverId: this.id,
      extensionId: this.extensionId,
    })
    this.runtime.unregisterCapabilities(this.id)
    this.clearHealthChecks()
    await this.stopLaunch?.()
    this.stopLaunch = undefined
    this.status = 'stopped'
    this.pid = undefined
    this.stoppedAt = this.runtime.now()
    this.appendLog('system', `Stopped server ${this.id}.`)
    this.runtime.emit(this.id, {
      type: 'stopped',
      serverId: this.id,
      extensionId: this.extensionId,
    })
  }

  async restart() {
    return this.enqueue(async () => {
      this.restarts += 1
      this.runtime.emit(this.id, {
        type: 'restarting',
        serverId: this.id,
        extensionId: this.extensionId,
      })
      await this.stopUnlocked()
      this.status = 'restarting'
      await this.startUnlocked()
    })
  }

  async getLogs(options: LogQuery = {}) {
    let entries = this.logs
    if (options.stream) entries = entries.filter((entry) => entry.stream === options.stream)
    const since = options.since
    if (since) entries = entries.filter((entry) => entry.timestamp >= since)
    if (options.limit && options.limit > 0) entries = entries.slice(-options.limit)
    return [...entries]
  }

  async getMetrics(): Promise<ExtensionMetrics> {
    return {
      restarts: this.restarts,
      uptimeMs: this.startedAt ? Math.max(0, this.runtime.now() - this.startedAt) : undefined,
      lastExitCode: this.lastExitCode,
      lastSignal: this.lastSignal,
    }
  }

  appendLog(stream: ExtensionLogEntry['stream'], message: string, level?: ServerLogLevel) {
    const entry = {
      timestamp: this.runtime.now(),
      serverId: this.id,
      extensionId: this.extensionId,
      level: level ?? (stream === 'stderr' ? 'error' : stream === 'system' ? 'info' : 'debug'),
      stream,
      message,
    }
    this.logs.push(entry)
    if (this.logs.length > this.declaration.logBufferSize) {
      this.logs.splice(0, this.logs.length - this.declaration.logBufferSize)
    }
    this.runtime.emit(this.id, {
      type: 'log',
      serverId: this.id,
      extensionId: this.extensionId,
      entry,
    })
  }

  async handleExit(exit: ServerExtensionExit) {
    this.lastExitCode = exit.code ?? null
    this.lastSignal = exit.signal ?? null
    this.stopLaunch = undefined
    this.pid = undefined
    this.runtime.unregisterCapabilities(this.id)
    this.clearHealthChecks()
    if (this.status === 'stopping' || this.status === 'stopped' || this.status === 'disabled') {
      return
    }

    const failed = exit.error || (exit.code !== undefined && exit.code !== null && exit.code !== 0)
    if (failed) this.crashes += 1
    const policy = this.declaration.restart.policy
    const shouldRestart =
      policy === 'always' ||
      policy === 'unless-disabled' ||
      (policy === 'on-failure' && Boolean(failed))

    if (!shouldRestart) {
      this.status = failed ? 'failed' : 'stopped'
      this.lastError = exit.error
      this.runtime.emit(
        this.id,
        failed
          ? {
              type: 'failed',
              serverId: this.id,
              extensionId: this.extensionId,
              error: exit.error ?? `Exited with code ${exit.code ?? 'unknown'}.`,
            }
          : { type: 'stopped', serverId: this.id, extensionId: this.extensionId },
      )
      return
    }

    const now = this.runtime.now()
    const windowStart = now - this.declaration.restart.windowMs
    this.restartTimestamps = this.restartTimestamps.filter((timestamp) => timestamp >= windowStart)
    if (this.restartTimestamps.length >= this.declaration.restart.maxRestarts) {
      this.status = 'failed'
      this.lastError = 'Restart policy stopped a restart loop.'
      this.runtime.emit(this.id, {
        type: 'failed',
        serverId: this.id,
        extensionId: this.extensionId,
        error: this.lastError,
      })
      return
    }

    this.restartTimestamps.push(now)
    this.restarts += 1
    this.status = 'restarting'
    this.runtime.emit(this.id, {
      type: 'restarting',
      serverId: this.id,
      extensionId: this.extensionId,
    })
    await this.runtime.delay(this.declaration.restart.backoffMs)
    await this.startUnlocked()
  }

  snapshot(): ServerRuntimeStatusSnapshot {
    return {
      id: this.id,
      extensionId: this.extensionId,
      label: this.declaration.label,
      extensionName: this.manifest.displayName,
      status: this.status,
      startup: this.declaration.startup,
      restartPolicy: this.declaration.restart.policy,
      pid: this.pid,
      port: this.port,
      origin: this.origin,
      uptimeMs: this.startedAt ? Math.max(0, this.runtime.now() - this.startedAt) : undefined,
      crashCount: this.crashes,
      lastError: this.lastError,
      lastStartTime: this.startedAt,
      lastStopTime: this.stoppedAt,
      lastHealthCheckAt: this.lastHealthCheckAt,
      unsupportedReason: this.unsupportedReason,
    }
  }

  private enqueue(task: () => Promise<void>) {
    const next = (this.operation ?? Promise.resolve()).then(task, task)
    this.operation = next.finally(() => {
      if (this.operation === next) this.operation = undefined
    })
    return next
  }

  private scheduleHealthChecks(
    checkHealth: ServerExtensionLaunchResult['checkHealth'] | undefined,
  ) {
    this.clearHealthChecks()
    if (!this.declaration.health && !checkHealth) return
    const interval = this.declaration.health?.intervalMs ?? 5000
    this.healthTimer = globalThis.setInterval(() => {
      void this.runHealthCheck(checkHealth)
    }, interval)
  }

  private clearHealthChecks() {
    if (this.healthTimer) globalThis.clearInterval(this.healthTimer)
    this.healthTimer = undefined
  }

  private async runHealthCheck(
    checkHealth: ServerExtensionLaunchResult['checkHealth'] | undefined,
  ) {
    if (this.status !== 'running' && this.status !== 'ready' && this.status !== 'degraded') return
    this.lastHealthCheckAt = this.runtime.now()
    try {
      const health = checkHealth ? await checkHealth() : await this.runtime.checkHttpHealth(this)
      if (health.ok) {
        if (this.status === 'degraded') this.status = 'running'
        this.lastError = undefined
        this.runtime.emit(this.id, {
          type: 'running',
          serverId: this.id,
          extensionId: this.extensionId,
          origin: this.origin,
        })
        return
      }
      this.status = 'degraded'
      this.lastError = health.reason ?? 'Health check failed.'
      this.runtime.emit(this.id, {
        type: 'degraded',
        serverId: this.id,
        extensionId: this.extensionId,
        reason: this.lastError,
      })
      if (
        this.declaration.restart.policy === 'on-failure' ||
        this.declaration.restart.policy === 'always'
      ) {
        await this.handleExit({ error: this.lastError })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.status = 'degraded'
      this.lastError = message
      this.runtime.emit(this.id, {
        type: 'degraded',
        serverId: this.id,
        extensionId: this.extensionId,
        reason: message,
      })
    }
  }
}

class ManagedActiveLaneServerRuntime implements ActiveLaneServerRuntime {
  readonly hostKind: ActiveLaneHostKind
  private servers = new Map<string, ActiveLaneServerHandle>()
  private extensions = new Map<string, ManagedServerExtensionHandle>()
  private listeners = new Map<string, Set<(event: ServerExtensionEvent) => void>>()
  private statusListeners = new Set<(status: ServerRuntimeStatusSnapshot) => void>()
  private logListeners = new Map<string, Set<(entry: ExtensionLogEntry) => void>>()
  private capabilityDisposables = new Map<string, Disposable[]>()
  private launcher?: ServerExtensionLauncher
  private capabilities?: ActiveLaneCapabilityService
  private clock: () => number

  constructor(options: ActiveLaneServerRuntimeOptions) {
    this.hostKind = options.hostKind
    this.launcher = options.launcher
    this.capabilities = options.capabilities
    this.clock = options.now ?? (() => Date.now())
  }

  now() {
    return this.clock()
  }

  delay(ms: number) {
    return new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, ms)
    })
  }

  async checkHttpHealth(handle: ServerExtensionHandle) {
    const path = handle.declaration.health?.http
    if (!path || !handle.origin || typeof globalThis.fetch !== 'function') return { ok: true }
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(
      () => controller.abort(),
      handle.declaration.health?.timeoutMs ?? 1500,
    )
    try {
      const url = new URL(path, handle.origin)
      const response = await globalThis.fetch(url, { signal: controller.signal })
      return {
        ok: response.ok,
        reason: response.ok ? undefined : `HTTP health check returned ${response.status}.`,
      }
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : String(error) }
    } finally {
      globalThis.clearTimeout(timeout)
    }
  }

  getRuntimeServer(id = 'default') {
    return this.servers.get(id)
  }

  async ensureServer(options: EnsureServerOptions = {}) {
    return this.getRuntimeServer(options.id) ?? this.createServer(options)
  }

  async createServer(options: CreateServerOptions = {}) {
    const id = options.id ?? 'default'
    const handle: ActiveLaneServerHandle = {
      id,
      kind:
        options.kind ?? (options.origin || options.prefer === 'remote' ? 'remote' : 'in-process'),
      status: 'ready',
      origin: options.origin,
      startedAt: this.now(),
    }
    this.servers.set(id, handle)
    return handle
  }

  listRuntimeServers() {
    return [...this.servers.values()]
  }

  registerExtension(options: RegisterServerExtensionOptions) {
    const normalized = normalizeServerExtensionDeclaration(
      options.server ?? options.manifest.server,
    )
    if (!normalized.ok || !normalized.server) {
      throw new Error(
        `Invalid server extension declaration for ${options.manifest.id}:\n${normalized.issues
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join('\n')}`,
      )
    }
    const serverId =
      normalized.server.id === 'default'
        ? options.manifest.id
        : `${options.manifest.id}:${normalized.server.id}`
    const existing = this.extensions.get(serverId)
    if (existing) return existing
    const handle = new ManagedServerExtensionHandle(
      serverId,
      options.manifest.id,
      options.manifest,
      {
        ...normalized.server,
        id: serverId,
        label:
          normalized.server.label === 'Server'
            ? options.manifest.displayName
            : normalized.server.label,
      },
      this,
    )
    if (handle.declaration.startup === 'disabled') handle.status = 'disabled'
    this.extensions.set(handle.id, handle)
    this.emit(handle.id, {
      type: 'registered',
      serverId: handle.id,
      extensionId: handle.extensionId,
    })
    return handle
  }

  listServers() {
    return [...this.extensions.values()]
  }

  getServer(id: string) {
    return this.extensions.get(id)
  }

  async startServer(id: string) {
    const extension = this.requireExtension(id)
    await extension.start()
    return extension
  }

  async stopServer(id: string) {
    await this.requireExtension(id).stop()
  }

  async restartServer(id: string) {
    const extension = this.requireExtension(id)
    await extension.restart()
    return extension
  }

  getServerStatus(id: string) {
    return this.extensions.get(id)?.snapshot()
  }

  watchServerStatus(listener: (status: ServerRuntimeStatusSnapshot) => void): Disposable {
    this.statusListeners.add(listener)
    for (const extension of this.extensions.values()) listener(extension.snapshot())
    return {
      dispose: () => {
        this.statusListeners.delete(listener)
      },
    }
  }

  watchServerLogs(id: string, listener: (entry: ExtensionLogEntry) => void): Disposable {
    const listeners = this.logListeners.get(id) ?? new Set()
    listeners.add(listener)
    this.logListeners.set(id, listeners)
    void this.extensions
      .get(id)
      ?.getLogs()
      .then((entries) => {
        entries.forEach((entry) => {
          listener(entry)
        })
      })
    return {
      dispose: () => {
        listeners.delete(listener)
        if (!listeners.size) this.logListeners.delete(id)
      },
    }
  }

  async startExtension(extensionId: string) {
    const extension = this.requireExtension(extensionId)
    await extension.start()
    return extension
  }

  async stopExtension(extensionId: string) {
    await this.requireExtension(extensionId).stop()
  }

  async restartExtension(extensionId: string) {
    const extension = this.requireExtension(extensionId)
    await extension.restart()
    return extension
  }

  getExtension(extensionId: string) {
    return this.extensions.get(extensionId)
  }

  listExtensions() {
    return [...this.extensions.values()]
  }

  watchExtension(extensionId: string, listener: (event: ServerExtensionEvent) => void): Disposable {
    const listeners = this.listeners.get(extensionId) ?? new Set()
    listeners.add(listener)
    this.listeners.set(extensionId, listeners)
    return {
      dispose: () => {
        listeners.delete(listener)
        if (!listeners.size) this.listeners.delete(extensionId)
      },
    }
  }

  async dispose() {
    await Promise.all([...this.extensions.values()].map((extension) => extension.stop()))
    this.listeners.clear()
    this.statusListeners.clear()
    this.logListeners.clear()
    this.servers.clear()
  }

  async launch(handle: ManagedServerExtensionHandle): Promise<ServerExtensionLaunchResult> {
    const env: Record<string, string> = {
      ...(handle.declaration.env ?? {}),
      ACTIVELANE_EXTENSION_ID: handle.id,
    }
    if (handle.declaration.ports.strategy !== 'none') {
      const port = handle.declaration.ports.port ?? this.allocatePort(handle.id)
      env[handle.declaration.ports.env] = String(port)
    }
    if (this.launcher) {
      return this.launcher({
        extensionId: handle.id,
        manifest: handle.manifest,
        declaration: handle.declaration,
        port: env[handle.declaration.ports.env]
          ? Number(env[handle.declaration.ports.env])
          : undefined,
        env,
        log: (stream, message) => handle.appendLog(stream, message),
        onExit: (exit) => {
          void handle.handleExit(exit)
        },
      })
    }
    if (handle.declaration.mode !== 'remote') {
      const reason = `Host ${this.hostKind} cannot start ${handle.declaration.mode} server processes without a server launcher.`
      handle.unsupportedReason = reason
      throw new Error(reason)
    }
    return { origin: handle.manifest.entry }
  }

  registerCapabilities(handle: ServerExtensionHandle) {
    if (!this.capabilities) return
    this.unregisterCapabilities(handle.id)
    const declared = [
      ...(handle.manifest.capabilities ?? []),
      ...(handle.manifest.contributes?.capabilities ?? []),
      ...handle.declaration.capabilities.map(
        (id): ActiveLaneCapability => ({
          id,
          kind: 'api',
          title: id,
          extensionId: handle.id,
          availability: handle.declaration.mode === 'remote' ? 'remote' : 'server',
        }),
      ),
    ]
    const capabilities = this.capabilities
    if (!capabilities) return
    const disposables = declared.map((capability) =>
      capabilities.register(
        { ...capability, extensionId: capability.extensionId ?? handle.id },
        undefined,
        { source: 'server-extension' },
      ),
    )
    this.capabilityDisposables.set(handle.id, disposables)
  }

  unregisterCapabilities(extensionId: string) {
    const disposables = this.capabilityDisposables.get(extensionId) ?? []
    disposables.forEach((disposable) => {
      disposable.dispose()
    })
    this.capabilityDisposables.delete(extensionId)
  }

  emit(extensionId: string, event: ServerExtensionEvent) {
    this.listeners.get(extensionId)?.forEach((listener) => {
      listener(event)
    })
    const snapshot = this.extensions.get(extensionId)?.snapshot()
    if (snapshot) {
      this.statusListeners.forEach((listener) => {
        listener(snapshot)
      })
    }
    if (event.type === 'log') {
      this.logListeners.get(extensionId)?.forEach((listener) => {
        listener(event.entry)
      })
    }
  }

  private requireExtension(extensionId: string) {
    const extension = this.extensions.get(extensionId)
    if (!extension) throw new Error(`Unknown server extension: ${extensionId}`)
    return extension
  }

  private allocatePort(extensionId: string) {
    let hash = 0
    for (const char of extensionId) hash = (hash * 31 + char.charCodeAt(0)) % 1000
    return 45000 + hash
  }
}

export function createActiveLaneServerRuntime(
  options: ActiveLaneServerRuntimeOptions,
): ActiveLaneServerRuntime {
  return new ManagedActiveLaneServerRuntime(options)
}
