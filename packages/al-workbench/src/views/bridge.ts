import {
  isViewConnectMessage,
  VIEW_PROTOCOL,
  type ViewPortMessage,
  type ViewRequest,
  type ViewResponse,
} from '@activelane/extension-view'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'
import type { Disposable } from '../core/shared/types'
import type { ViewDefinition, ViewInstance } from './model'

export interface IsolatedViewConnection {
  frame: HTMLIFrameElement
  definition: ViewDefinition
  instance: ViewInstance
}

export class ViewBridge implements Disposable {
  private readonly connections = new Map<string, IsolatedViewConnection>()
  private readonly ports = new Map<string, MessagePort>()
  private readonly subscriptions = new Map<string, Disposable[]>()
  private readonly listener = (event: MessageEvent) => this.connect(event)

  constructor(private readonly runtime: WorkbenchRuntimeApi) {
    window.addEventListener('message', this.listener)
  }

  register(connection: IsolatedViewConnection): Disposable {
    if (connection.definition.ownerExtensionId !== connection.instance.extensionId) {
      throw new Error('View definition and instance extension identities do not match.')
    }
    this.connections.set(connection.instance.id, connection)
    return { dispose: () => this.disconnect(connection.instance.id) }
  }

  dispose() {
    window.removeEventListener('message', this.listener)
    for (const id of this.connections.keys()) this.disconnect(id)
  }

  private connect(event: MessageEvent) {
    if (!isViewConnectMessage(event.data) || event.ports.length !== 1) return
    const identity = event.data.identity
    const connection = this.connections.get(identity.instanceId)
    if (!connection || event.source !== connection.frame.contentWindow) return
    if (
      identity.extensionId !== connection.instance.extensionId ||
      identity.definitionId !== connection.instance.definitionId
    )
      return
    this.ports.get(identity.instanceId)?.close()
    const port = event.ports[0]
    if (!port) return
    this.ports.set(identity.instanceId, port)
    port.onmessage = (message: MessageEvent<ViewPortMessage>) =>
      void this.handle(connection, port, message.data)
    port.start()
    const themeSubscription = this.runtime.themes.onDidChange(() => {
      port.postMessage({
        protocol: VIEW_PROTOCOL,
        type: 'event',
        event: 'theme.changed',
        value: currentTheme(this.runtime),
      })
    })
    this.subscriptions.set(identity.instanceId, [themeSubscription])
  }

  private async handle(
    connection: IsolatedViewConnection,
    port: MessagePort,
    message: ViewPortMessage,
  ) {
    if (!message || message.protocol !== VIEW_PROTOCOL || message.type !== 'request') return
    try {
      const result = await this.route(connection, message)
      this.respond(port, message.id, result)
    } catch (error) {
      this.respond(port, message.id, undefined, {
        code: error instanceof ViewBridgeError ? error.code : 'VIEW_REQUEST_FAILED',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async route(connection: IsolatedViewConnection, request: ViewRequest) {
    const parameters = objectParameters(request.params)
    const { instance, definition } = connection
    switch (request.method) {
      case 'view.ready':
        return { instanceId: instance.id }
      case 'view.getContext':
        return cloneViewContext(instance.context)
      case 'view.setTitle':
        instance.title = requiredString(parameters, 'title')
        this.runtime.workbench.setTabTitle(instance.id, instance.title)
        return undefined
      case 'view.setDirty':
        instance.dirty = requiredBoolean(parameters, 'dirty')
        this.runtime.workbench.markTabDirty(instance.id, instance.dirty)
        return undefined
      case 'view.close':
        this.runtime.workbench.closeTab(instance.id)
        return undefined
      case 'commands.execute': {
        const command = requiredString(parameters, 'command')
        const contribution = this.runtime.registry.commands.find(
          (candidate) => candidate.id === command,
        )
        if (contribution?.ownerExtensionId !== instance.extensionId) {
          throw new ViewBridgeError('COMMAND_DENIED', `View cannot execute command ${command}.`)
        }
        return this.runtime.commands.execute(command)
      }
      case 'services.call': {
        const capability = `${requiredString(parameters, 'service')}.${requiredString(parameters, 'method')}`
        this.authorize(definition, capability)
        return this.runtime.capabilities.invoke(capability, parameters.args, instance.extensionId)
      }
      case 'events.emit': {
        const event = requiredString(parameters, 'event')
        for (const [instanceId, candidatePort] of this.ports) {
          const candidate = this.connections.get(instanceId)
          if (candidate?.instance.extensionId === instance.extensionId) {
            candidatePort.postMessage({
              protocol: VIEW_PROTOCOL,
              type: 'event',
              event,
              value: parameters.value,
            })
          }
        }
        return undefined
      }
      case 'storage.get':
        return this.storage(instance).get(requiredString(parameters, 'key'))
      case 'storage.set':
        return this.storage(instance).set(requiredString(parameters, 'key'), parameters.value)
      case 'theme.getCurrent':
        return currentTheme(this.runtime)
      default:
        throw new ViewBridgeError(
          'METHOD_NOT_ALLOWED',
          `View method ${request.method} is not available.`,
        )
    }
  }

  private storage(instance: ViewInstance) {
    const permissions = this.runtime.extensions.getRecord(instance.extensionId)?.manifest
      .permissions
    if (!Array.isArray(permissions) || !permissions.includes('extension-storage')) {
      throw new ViewBridgeError(
        'CAPABILITY_DENIED',
        'The extension did not declare extension-storage.',
      )
    }
    const adapter = this.runtime.host.capabilities.storage
    if (!adapter)
      throw new ViewBridgeError('CAPABILITY_UNAVAILABLE', 'Extension storage is unavailable.')
    return adapter.scope(`extension.${instance.extensionId}`)
  }

  private authorize(definition: ViewDefinition, capability: string) {
    if (!definition.capabilities?.includes(capability)) {
      throw new ViewBridgeError(
        'CAPABILITY_DENIED',
        `View ${definition.id} did not declare ${capability}.`,
      )
    }
  }

  private respond(port: MessagePort, id: string, result?: unknown, error?: ViewResponse['error']) {
    port.postMessage({
      protocol: VIEW_PROTOCOL,
      type: 'response',
      id,
      result,
      error,
    } satisfies ViewResponse)
  }

  private disconnect(id: string) {
    this.connections.delete(id)
    this.ports.get(id)?.close()
    this.ports.delete(id)
    for (const subscription of this.subscriptions.get(id) ?? []) subscription.dispose()
    this.subscriptions.delete(id)
  }
}

class ViewBridgeError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

function objectParameters(value: unknown): Record<string, unknown> {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ViewBridgeError('INVALID_PARAMS', 'Request parameters must be an object.')
  return value as Record<string, unknown>
}
function requiredString(value: Record<string, unknown>, key: string) {
  if (typeof value[key] !== 'string' || !value[key])
    throw new ViewBridgeError('INVALID_PARAMS', `${key} must be a non-empty string.`)
  return value[key] as string
}
function requiredBoolean(value: Record<string, unknown>, key: string) {
  if (typeof value[key] !== 'boolean')
    throw new ViewBridgeError('INVALID_PARAMS', `${key} must be a boolean.`)
  return value[key] as boolean
}
function currentTheme(runtime: WorkbenchRuntimeApi) {
  const theme = runtime.themes.getActiveTheme()
  return {
    kind: theme?.type ?? runtime.themes.getSystemTheme(),
    tokens: Object.fromEntries(
      Object.entries(theme?.tokens ?? {}).map(([key, value]) => [
        `--al-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        value,
      ]),
    ),
  }
}

function cloneViewContext(value: unknown) {
  if (value === undefined) return undefined
  try {
    return JSON.parse(JSON.stringify(value)) as unknown
  } catch {
    throw new ViewBridgeError(
      'INVALID_CONTEXT',
      'Extension view context must be JSON-serializable.',
    )
  }
}
