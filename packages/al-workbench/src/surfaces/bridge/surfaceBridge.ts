import type {
  WorkbenchRuntimeApi,
  WorkbenchSurfaceDescriptor,
  WorkbenchSurfaceLifecycleEvent,
} from '@activelane/workbench-api'
import { canInvokeSurfaceCapability, canUseSurfaceBridge } from '../services/surfacePermissions'
import { isOriginAllowed, resolveSurfaceUrl } from '../utils/origins'
import {
  SURFACE_MESSAGE_TYPES,
  type SurfaceCapabilityRequestPayload,
  type SurfaceMessageEnvelope,
  type SurfaceResponsePayload,
} from './messageTypes'

export interface SurfaceBridgeRegistration {
  surface: WorkbenchSurfaceDescriptor
  frame: HTMLIFrameElement
  onLifecycle?: (event: WorkbenchSurfaceLifecycleEvent) => void
}

function isSurfaceEnvelope(value: unknown): value is SurfaceMessageEnvelope {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SurfaceMessageEnvelope>
  return typeof candidate.type === 'string' && typeof candidate.surfaceId === 'string'
}

function createLifecycleEvent(
  type: WorkbenchSurfaceLifecycleEvent['type'],
  surface: WorkbenchSurfaceDescriptor,
  payload?: unknown,
): WorkbenchSurfaceLifecycleEvent {
  return {
    type,
    surfaceId: surface.id,
    ownerExtensionId: surface.ownerExtensionId,
    payload,
    timestamp: new Date().toISOString(),
  }
}

export class WorkbenchSurfaceBridge {
  private readonly registrations = new Map<string, SurfaceBridgeRegistration>()
  private readonly listener = (event: MessageEvent) => {
    void this.handleMessage(event)
  }

  constructor(private readonly runtime: WorkbenchRuntimeApi) {
    if (typeof window !== 'undefined') window.addEventListener('message', this.listener)
  }

  register(registration: SurfaceBridgeRegistration) {
    this.registrations.set(registration.surface.id, registration)
    return {
      dispose: () => {
        this.registrations.delete(registration.surface.id)
        registration.onLifecycle?.(createLifecycleEvent('dispose', registration.surface))
      },
    }
  }

  dispose() {
    if (typeof window !== 'undefined') window.removeEventListener('message', this.listener)
    this.registrations.clear()
  }

  private async handleMessage(event: MessageEvent) {
    if (!isSurfaceEnvelope(event.data)) return
    const message = event.data
    const registration = this.registrations.get(message.surfaceId)
    if (!registration) return
    if (registration.frame.contentWindow !== event.source) return

    const { surface } = registration
    if (message.extensionId && message.extensionId !== surface.ownerExtensionId) {
      this.respond(registration, message, {
        ok: false,
        error: 'Surface extension identity does not match the registered owner.',
      })
      return
    }

    if (!isOriginAllowed(event.origin, surface, resolveSurfaceUrl(surface))) {
      this.respond(registration, message, {
        ok: false,
        error: `Surface origin ${event.origin} is not allowed.`,
      })
      return
    }

    if (message.type === SURFACE_MESSAGE_TYPES.ready) {
      registration.onLifecycle?.(createLifecycleEvent('ready', surface, message.payload))
      return
    }

    if (message.type === SURFACE_MESSAGE_TYPES.error) {
      registration.onLifecycle?.(createLifecycleEvent('error', surface, message.payload))
      return
    }

    if (message.type === SURFACE_MESSAGE_TYPES.event) {
      registration.onLifecycle?.(createLifecycleEvent('focus', surface, message.payload))
      return
    }

    if (message.type !== SURFACE_MESSAGE_TYPES.request) return

    if (!canUseSurfaceBridge(surface)) {
      this.respond(registration, message, {
        ok: false,
        error: 'Surface bridge is disabled for this surface.',
      })
      return
    }

    const payload = message.payload as SurfaceCapabilityRequestPayload | undefined
    const capabilityId = payload?.capability
    if (!capabilityId || !canInvokeSurfaceCapability(surface, capabilityId)) {
      this.respond(registration, message, {
        ok: false,
        error: `Capability ${capabilityId ?? '<missing>'} is not authorized for this surface.`,
      })
      return
    }

    const capability = this.runtime.capabilities.get(capabilityId)
    if (!capability) {
      this.respond(registration, message, {
        ok: false,
        error: `Capability ${capabilityId} is not available.`,
      })
      return
    }

    try {
      const result = await this.runtime.capabilities.invoke(
        capabilityId,
        payload?.input,
        surface.ownerExtensionId,
      )
      this.respond(registration, message, { ok: true, result })
    } catch (error) {
      this.respond(registration, message, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private respond(
    registration: SurfaceBridgeRegistration,
    request: SurfaceMessageEnvelope,
    payload: SurfaceResponsePayload,
  ) {
    if (!request.correlationId) return
    registration.frame.contentWindow?.postMessage(
      {
        type: SURFACE_MESSAGE_TYPES.response,
        surfaceId: registration.surface.id,
        extensionId: registration.surface.ownerExtensionId,
        correlationId: request.correlationId,
        payload,
      } satisfies SurfaceMessageEnvelope<SurfaceResponsePayload>,
      registration.surface.bridge?.targetOrigin ?? '*',
    )
  }
}
