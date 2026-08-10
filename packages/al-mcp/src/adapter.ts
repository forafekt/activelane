import type { ActiveLaneCapability } from '@activelane/workbench-api'
import type { McpRegisteredCapability } from './types'

export type McpAdapterCapabilityKind = Extract<
  ActiveLaneCapability['kind'],
  'mcp.tool' | 'mcp.resource'
>

export function isMcpCapabilityKind(
  kind: ActiveLaneCapability['kind'],
): kind is McpAdapterCapabilityKind {
  return kind === 'mcp.tool' || kind === 'mcp.resource'
}

export function toActiveLaneCapability(capability: McpRegisteredCapability): ActiveLaneCapability {
  return {
    id: capability.id,
    kind:
      capability.kind === 'tool'
        ? 'mcp.tool'
        : capability.kind === 'resource'
          ? 'mcp.resource'
          : 'command',
    title: capability.title,
    description: capability.description,
    inputSchema: capability.inputSchema,
    outputSchema: capability.outputSchema,
    permissions: capability.permissions,
    extensionId: capability.ownerExtensionId,
    transport: 'mcp',
    availability: 'remote',
    metadata:
      capability.kind === 'resource'
        ? { uriTemplate: capability.uriTemplate, mimeType: capability.mimeType }
        : undefined,
  }
}

export function fromActiveLaneCapability(
  capability: ActiveLaneCapability,
): McpRegisteredCapability {
  if (capability.kind === 'mcp.resource') {
    return {
      id: capability.id,
      kind: 'resource',
      title: capability.title,
      description: capability.description,
      inputSchema: capability.inputSchema,
      outputSchema: capability.outputSchema,
      permissions: capability.permissions,
      ownerExtensionId: capability.extensionId,
      uriTemplate:
        typeof capability.metadata?.uriTemplate === 'string'
          ? capability.metadata.uriTemplate
          : undefined,
      mimeType:
        typeof capability.metadata?.mimeType === 'string'
          ? capability.metadata.mimeType
          : undefined,
    }
  }
  return {
    id: capability.id,
    kind: 'tool',
    title: capability.title,
    description: capability.description,
    inputSchema: capability.inputSchema,
    outputSchema: capability.outputSchema,
    permissions: capability.permissions,
    ownerExtensionId: capability.extensionId,
  }
}
