import {
  resolveWorkbenchExtensionModule,
  type WorkbenchExtensionDefinition,
} from '@activelane/workbench'
import type { InstalledExtensionRecord } from '@activelane/workbench'

export interface NativeExtensionModulePayload {
  source?: string
  entrypoint?: string
  contentType?: string
  sizeBytes?: number
  sha256?: string
}

export interface NativeExtensionModuleLoadDescriptor {
  record: InstalledExtensionRecord
  payload: NativeExtensionModulePayload
}

type LoadPhase = 'native response validation' | 'module evaluation' | 'module contract validation'

function extensionBoundary(descriptor: NativeExtensionModuleLoadDescriptor) {
  const { record, payload } = descriptor
  const preview = payload.source?.trimStart().slice(0, 160).replace(/\s+/g, ' ')
  return [
    `Failed to load extension ${record.extensionId}@${record.version}`,
    `Entrypoint: ${payload.entrypoint || `${record.resolvedPath ?? '<installed>'}/${record.manifest.entry ?? '<missing>'}`}`,
    `Resolved URL: ${payload.entrypoint || '<native module response>'}`,
    `Content-Type: ${payload.contentType || '<unspecified>'}`,
    `Size: ${payload.sizeBytes ?? payload.source?.length ?? 0} bytes`,
    `SHA-256: ${payload.sha256 || '<unavailable>'}`,
    preview ? `Source preview: ${preview}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')
}

function moduleDebugName(descriptor: NativeExtensionModuleLoadDescriptor) {
  const { record, payload } = descriptor
  const entrypoint = payload.entrypoint || record.manifest.entry || 'extension.js'
  return `activelane-extension://${encodeURIComponent(record.extensionId)}@${encodeURIComponent(record.version)}/${entrypoint.replace(/^\/+/, '')}`
}

function wrapExtensionModuleError(
  descriptor: NativeExtensionModuleLoadDescriptor,
  phase: LoadPhase,
  cause: unknown,
) {
  const causeMessage = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause)
  const error = new Error(`${extensionBoundary(descriptor)}\nPhase: ${phase}\nCause: ${causeMessage}`)
  if (cause instanceof Error && cause.stack) error.stack = `${error.message}\nCaused by: ${cause.stack}`
  return error
}

function assertJavaScriptModulePayload(descriptor: NativeExtensionModuleLoadDescriptor): string {
  const { payload, record } = descriptor
  if (!payload.source) {
    throw wrapExtensionModuleError(
      descriptor,
      'native response validation',
      new Error('Native service returned no module source.'),
    )
  }
  if (
    record.installSource !== 'development' &&
    record.manifest.entry &&
    payload.entrypoint &&
    !payload.entrypoint.endsWith(record.manifest.entry)
  ) {
    throw wrapExtensionModuleError(
      descriptor,
      'native response validation',
      new Error(
        `Native service returned ${payload.entrypoint}, which does not match manifest entry ${record.manifest.entry}.`,
      ),
    )
  }
  if (
    payload.contentType &&
    payload.contentType !== 'text/javascript' &&
    payload.contentType !== 'application/javascript'
  ) {
    throw wrapExtensionModuleError(
      descriptor,
      'native response validation',
      new Error(`Expected JavaScript module source, received ${payload.contentType}.`),
    )
  }
  const trimmed = payload.source.trimStart()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed)
      throw wrapExtensionModuleError(
        descriptor,
        'native response validation',
        new Error('Expected JavaScript module source, received JSON.'),
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes('Expected JavaScript')) throw error
    }
  }
  if (/^<!doctype html\b|^<html[\s>]/i.test(trimmed)) {
    throw wrapExtensionModuleError(
      descriptor,
      'native response validation',
      new Error('Expected JavaScript module source, received HTML.'),
    )
  }
  return payload.source
}

export async function loadNativeExtensionModule(
  descriptor: NativeExtensionModuleLoadDescriptor,
): Promise<WorkbenchExtensionDefinition> {
  const source = assertJavaScriptModulePayload(descriptor)
  const debugName = moduleDebugName(descriptor)
  const url = URL.createObjectURL(
    new Blob([`${source}\n//# sourceURL=${debugName}\n`], { type: 'text/javascript' }),
  )
  try {
    let namespace: unknown
    try {
      namespace = await import(/* @vite-ignore */ url)
    } catch (error) {
      throw wrapExtensionModuleError(descriptor, 'module evaluation', error)
    }
    try {
      return resolveWorkbenchExtensionModule(namespace, {
        extensionId: descriptor.record.extensionId,
        version: descriptor.record.version,
        source: descriptor.record.source?.registryId ?? descriptor.record.installSource,
        entrypoint:
          descriptor.payload.entrypoint ||
          `${descriptor.record.resolvedPath ?? '<installed>'}/${descriptor.record.manifest.entry}`,
      })
    } catch (error) {
      throw wrapExtensionModuleError(descriptor, 'module contract validation', error)
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
