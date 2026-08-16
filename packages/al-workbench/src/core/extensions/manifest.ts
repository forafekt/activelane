import { normalizeServerExtensionDeclaration } from '../serverRuntime'
import type {
  ActiveLaneExtensionKind,
  ActiveLaneExtensionManifest,
  ActiveLaneExtensionVisibility,
  ActiveLaneHostSupport,
  WorkbenchExtensionManifest,
} from './types'

export const ACTIVELANE_MANIFEST_FILE = 'activelane.manifest.json'
export const ACTIVELANE_MANIFEST_SCHEMA_VERSION = '1.0.0'

export interface ManifestValidationIssue {
  path: string
  message: string
}

export interface ManifestValidationResult {
  ok: boolean
  manifest?: ActiveLaneExtensionManifest
  issues: ManifestValidationIssue[]
  warnings?: ManifestValidationIssue[]
}

export interface HostCompatibilityInput {
  hostKind: ActiveLaneHostSupport
  activelaneVersion: string
}

const visibilityValues = new Set<ActiveLaneExtensionVisibility>([
  'public',
  'private',
  'unlisted',
  'company',
])
const hostValues = new Set<ActiveLaneHostSupport>([
  'webapp',
  'desktop',
  'browser-extension',
  'server',
])
const kindValues = new Set<ActiveLaneExtensionKind>(['workbench', 'server'])
const operatingSystemValues = new Set(['linux', 'darwin', 'windows'] as const)
const architectureValues = new Set(['amd64', 'arm64', '386'] as const)

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function requireString(
  source: Record<string, unknown>,
  key: string,
  issues: ManifestValidationIssue[],
) {
  const value = asString(source[key])
  if (!value) issues.push({ path: key, message: `${key} must be a non-empty string.` })
  return value
}

function readStringArray<T extends string>(
  source: Record<string, unknown>,
  key: string,
  allowed: Set<T>,
  issues: ManifestValidationIssue[],
) {
  const value = source[key]
  if (!Array.isArray(value) || value.length === 0) {
    issues.push({ path: key, message: `${key} must be a non-empty array.` })
    return []
  }
  const values: T[] = []
  value.forEach((item, index) => {
    if (typeof item !== 'string' || !allowed.has(item as T)) {
      issues.push({ path: `${key}.${index}`, message: `Unsupported ${key} value.` })
      return
    }
    values.push(item as T)
  })
  return values
}

function readOptionalStringArray<T extends string>(
  source: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<T>,
  issues: ManifestValidationIssue[],
) {
  if (source[key] === undefined) return undefined
  const value = source[key]
  if (!Array.isArray(value)) {
    issues.push({ path: key, message: `${key} must be an array.` })
    return undefined
  }
  const values: T[] = []
  value.forEach((item, index) => {
    if (typeof item !== 'string' || !allowed.has(item as T)) {
      issues.push({ path: `${key}.${index}`, message: `Unsupported ${key} value.` })
      return
    }
    values.push(item as T)
  })
  return values
}

export function parseExtensionId(extensionId: string) {
  const match = extensionId.match(/^@([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)$/i)
  if (!match) throw new Error(`Invalid ActiveLane extension id: ${extensionId}`)
  const [, publisher, name] = match
  if (!publisher || !name) throw new Error(`Invalid ActiveLane extension id: ${extensionId}`)
  return { publisher, name }
}

export function normalizeActiveLaneManifest(input: unknown): ManifestValidationResult {
  const issues: ManifestValidationIssue[] = []
  const warnings: ManifestValidationIssue[] = []
  if (!isObject(input)) {
    return {
      ok: false,
      issues: [{ path: '$', message: 'Manifest must be an object.' }],
      warnings,
    }
  }

  const rawId = requireString(input, 'id', issues)
  let parsed: { publisher: string; name: string } | undefined
  try {
    parsed = parseExtensionId(rawId)
  } catch (error) {
    issues.push({ path: 'id', message: error instanceof Error ? error.message : String(error) })
  }

  const schemaVersion = asString(input.schemaVersion)
  if (schemaVersion !== ACTIVELANE_MANIFEST_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `schemaVersion must be ${ACTIVELANE_MANIFEST_SCHEMA_VERSION}.`,
    })
  }

  const publisher = asString(input.publisher) || parsed?.publisher || ''
  const name = asString(input.name) || parsed?.name || ''
  if (!publisher)
    issues.push({ path: 'publisher', message: 'publisher must be a non-empty string.' })
  if (!name) issues.push({ path: 'name', message: 'name must be a non-empty string.' })
  if (parsed && parsed.publisher !== publisher) {
    issues.push({ path: 'publisher', message: 'publisher must match the id scope.' })
  }
  if (parsed && parsed.name !== name) {
    issues.push({ path: 'name', message: 'name must match the id name segment.' })
  }

  const version = requireString(input, 'version', issues)
  if (version && !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    issues.push({ path: 'version', message: 'version must be a semantic version.' })
  }

  const engines = isObject(input.engines) ? input.engines : {}
  if (!isObject(input.engines))
    issues.push({ path: 'engines', message: 'engines must be an object.' })
  const activelaneEngine = requireString(engines, 'activelane', issues)
  const visibility = asString(input.visibility) || 'private'
  if (!visibilityValues.has(visibility as ActiveLaneExtensionVisibility)) {
    issues.push({ path: 'visibility', message: 'visibility is not supported.' })
  }

  const manifest: ActiveLaneExtensionManifest = {
    ...(input as unknown as WorkbenchExtensionManifest),
    schemaVersion: ACTIVELANE_MANIFEST_SCHEMA_VERSION,
    id: rawId as `@${string}/${string}`,
    publisher,
    name,
    displayName: requireString(input, 'displayName', issues),
    version,
    description: requireString(input, 'description', issues),
    entry:
      asString(input.entry) || asString((input.server as { entry?: unknown } | undefined)?.entry),
    engines: { activelane: activelaneEngine },
    hostSupport: readStringArray(input, 'hostSupport', hostValues, issues),
    capabilities: Array.isArray(input.capabilities)
      ? (input.capabilities as ActiveLaneExtensionManifest['capabilities'])
      : [],
    permissions:
      Array.isArray(input.permissions) || isObject(input.permissions) ? input.permissions : {},
    dependencies: isObject(input.dependencies)
      ? (input.dependencies as Record<string, string>)
      : {},
    extensionKind: readStringArray(input, 'extensionKind', kindValues, issues),
    visibility: visibility as ActiveLaneExtensionVisibility,
    os: readOptionalStringArray(input, 'os', operatingSystemValues, issues),
    architecture: readOptionalStringArray(input, 'architecture', architectureValues, issues),
  }
  if (input.server !== undefined) {
    const serverResult = normalizeServerExtensionDeclaration(input.server)
    if (serverResult.ok && serverResult.server) {
      manifest.server = {
        ...(isObject(input.server) ? (input.server as Record<string, unknown>) : {}),
        ...serverResult.server,
      } as ActiveLaneExtensionManifest['server']
    } else {
      issues.push(...serverResult.issues)
    }
  }
  if (!manifest.entry) issues.push({ path: 'entry', message: 'entry must be a non-empty string.' })

  return {
    ok: issues.length === 0,
    manifest: issues.length ? undefined : manifest,
    issues,
    warnings,
  }
}

export function assertActiveLaneManifest(input: unknown): ActiveLaneExtensionManifest {
  const result = normalizeActiveLaneManifest(input)
  if (!result.ok || !result.manifest) {
    const message = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')
    throw new Error(`Invalid ActiveLane extension manifest:\n${message}`)
  }
  return result.manifest
}

export function isHostSupported(
  manifest: ActiveLaneExtensionManifest,
  hostKind: ActiveLaneHostSupport,
) {
  return manifest.hostSupport?.includes(hostKind) ?? false
}

export function isActiveLaneEngineCompatible(range: string, activelaneVersion: string) {
  if (range === '*' || range === activelaneVersion) return true
  const caret = range.match(/^\^(\d+)\.(\d+)\.(\d+)/)
  if (caret) return parseMajor(activelaneVersion) === Number(caret[1])
  const minimum = range.match(/^>=(\d+)\.(\d+)\.(\d+)/)
  if (minimum) {
    const [major = 0, minor = 0, patch = 0] = activelaneVersion.split('.').map(Number)
    const [, minMajor = 0, minMinor = 0, minPatch = 0] = minimum.map(Number)
    return (
      major > minMajor ||
      (major === minMajor && (minor > minMinor || (minor === minMinor && patch >= minPatch)))
    )
  }
  return false
}

export function checkManifestCompatibility(
  manifest: ActiveLaneExtensionManifest,
  input: HostCompatibilityInput,
) {
  const issues: ManifestValidationIssue[] = []
  if (!isHostSupported(manifest, input.hostKind)) {
    issues.push({
      path: 'hostSupport',
      message: `Extension does not support host ${input.hostKind}.`,
    })
  }
  if (!isActiveLaneEngineCompatible(manifest.engines?.activelane ?? '', input.activelaneVersion)) {
    issues.push({
      path: 'engines.activelane',
      message: `Extension requires ActiveLane ${manifest.engines?.activelane ?? 'unknown'}.`,
    })
  }
  return { ok: issues.length === 0, issues }
}

function parseMajor(version: string) {
  const match = version.match(/^(\d+)\./)
  return match ? Number(match[1]) : undefined
}
